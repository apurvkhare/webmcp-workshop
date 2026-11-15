/** The Guide tab: the README of the step that is loaded, and how to move to another one. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { Guide } from '../server/guide.ts';
import { copyText } from './hooks.ts';
import { renderMarkdown } from './markdown.ts';

function useGuide() {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    let latest = 0;
    const load = async () => {
      const call = ++latest;
      try {
        const next = (await (await fetch('/__workshop/guide', { cache: 'no-store' })).json()) as Guide;
        if (call !== latest) return;
        setGuide(next);
        setOffline(false);
      } catch {
        if (call === latest) setOffline(true);
      }
    };
    void load();
    // The dev server says when the README changed. A new step reloads the whole page instead.
    import.meta.hot?.on('workshop:guide', load);
    return () => import.meta.hot?.off('workshop:guide', load);
  }, []);
  return { guide, offline };
}

export function Command({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="ws-command">
      <code>{text}</code>
      <button
        type="button"
        onClick={() => {
          void copyText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  );
}

export function GuideTab() {
  const { guide, offline } = useGuide();
  const [picked, setPicked] = useState<string | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const html = useMemo(() => (guide?.readme ? renderMarkdown(guide.readme) : ''), [guide?.readme]);
  const stepKey = `${guide?.appDir}:${guide?.step?.id}:${guide?.step?.kind}`;

  // A new step starts at the top. The same README re-rendering keeps its scroll position.
  useLayoutEffect(() => {
    body.current?.scrollTo({ top: 0 });
    setPicked(null);
  }, [stepKey]);

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-copy]');
    const code = button?.parentElement?.querySelector('code');
    if (!button || !code) return;
    void copyText(code.textContent ?? '');
    button.textContent = 'Copied';
    setTimeout(() => (button.textContent = 'Copy'), 1200);
  };

  const step = guide?.step;
  const pickedStep = guide?.steps.find((s) => s.id === picked);

  return (
    <div className="ws-guide">
      <header className="ws-guide-head">
        {step ? (
          <>
            <p className="ws-guide-section">{step.section}</p>
            <h2>
              <span className="ws-step-id">{step.id}</span> {step.title}
              <span className="ws-kind" data-kind={step.kind}>
                {step.kind}
              </span>
            </h2>
          </>
        ) : (
          <h2>{guide?.appDir === 'app' ? 'The finished code' : 'Guide'}</h2>
        )}
        {guide && (
          <nav className="ws-steps" aria-label="Workshop steps">
            {guide.steps.map((s) => (
              <button
                key={s.id}
                type="button"
                title={`${s.id} ${s.title}`}
                aria-current={s.id === step?.id ? 'step' : undefined}
                aria-pressed={s.id === picked}
                onClick={() => setPicked(s.id === picked || s.id === step?.id ? null : s.id)}
              >
                {s.id}
              </button>
            ))}
          </nav>
        )}
        {pickedStep && (
          <p className="ws-picked">
            <b>{pickedStep.id}</b> {pickedStep.title}. To load it, run <Command text={`npm run go ${pickedStep.id}`} />
          </p>
        )}
        {step && (
          <p className="ws-commands">
            <Command text="npm test" /> <Command text="npm run status" /> <Command text="npm run go next" />
          </p>
        )}
      </header>
      <div className="ws-guide-body" ref={body} onClick={onClick}>
        {offline && (
          <p className="ws-notice">
            The dev server isn’t answering. Is <code>npm start</code> still running?
          </p>
        )}
        {guide && !guide.readme && (
          <div className="ws-notice">
            <p>
              There is no README in <code>{guide.appDir}/</code>. Load a step:
            </p>
            <Command text="npm run go 2.1" />
          </div>
        )}
        {html && <article className="ws-markdown" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  );
}
