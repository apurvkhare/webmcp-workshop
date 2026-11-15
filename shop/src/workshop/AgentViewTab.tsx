/**
 * The Agent view tab: what an agent has to read to use this page, with and without WebMCP,
 * and the workshop's opening task replayed both ways by a script.
 */
import { useEffect, useRef, useState } from 'react';
import type { ShopApp } from '../client/shop.ts';
import { useLocation } from '../ui/router.ts';
import { useStored, useTools, webmcpSupported } from './hooks.ts';
import { TASK, byClicking, withTools, type ReplayKind, type ReplayResult, type ReplayStep } from './replay.ts';
import { approxTokens, describeTools, snapshotPage, type Snapshot } from './snapshot.ts';

const number = (n: number) => n.toLocaleString('en-IN');

function Size({ label, snapshot, empty }: { label: string; snapshot: Snapshot; empty?: string }) {
  return (
    <details className="ws-size">
      <summary>
        <span className="ws-size-label">{label}</span>
        <b>{number(snapshot.chars)}</b> characters
        <span className="ws-muted">
          {' '}
          · about {number(approxTokens(snapshot.chars))} tokens · {number(snapshot.lines)} lines
        </span>
      </summary>
      <pre>{snapshot.text || empty}</pre>
    </details>
  );
}

function StepList({ steps }: { steps: ReplayStep[] }) {
  return (
    <ol className="ws-replay-steps">
      {steps.map((step, i) => (
        <li key={i}>
          <span>{step.action}</span>
          {step.detail && <em>{step.detail}</em>}
          <small>read {number(step.read)} characters</small>
        </li>
      ))}
    </ol>
  );
}

export function AgentViewTab({ shop }: { shop: ShopApp }) {
  const location = useLocation();
  const { tools } = useTools();
  const [page, setPage] = useState<Snapshot>(() => snapshotPage());
  const [results, setResults] = useStored<Partial<Record<ReplayKind, ReplayResult>>>('replays', {});
  const [running, setRunning] = useState<{ kind: ReplayKind; steps: ReplayStep[] } | null>(null);
  const [shown, setShown] = useState<ReplayKind | null>(null);
  const [fast, setFast] = useStored('fast', false);
  const stop = useRef<AbortController | null>(null);

  // The page changes under us (navigation, a filled cart), so measure it again after it settles.
  useEffect(() => {
    const timer = setTimeout(() => setPage(snapshotPage()), 400);
    return () => clearTimeout(timer);
  }, [location, tools, running?.steps.length]);

  async function replay(kind: ReplayKind) {
    const controller = new AbortController();
    stop.current = controller;
    setRunning({ kind, steps: [] });
    setShown(kind);
    const result = await (kind === 'clicking' ? byClicking : withTools)(shop, {
      pace: fast ? 150 : 900,
      signal: controller.signal,
      onStep: (steps) => setRunning({ kind, steps })
    });
    setResults({ ...results, [kind]: result });
    setRunning(null);
  }

  const toolList = describeTools(tools);
  const live = running && shown === running.kind ? running.steps : shown ? (results[shown]?.steps ?? []) : [];
  const column = (kind: ReplayKind) => {
    const result = results[kind];
    const steps = running?.kind === kind ? running.steps : result?.steps;
    if (!steps) return { steps: '–', read: '–', outcome: 'Not run yet' };
    const read = steps.reduce((sum, s) => sum + s.read, 0);
    return {
      steps: String(steps.length),
      read: `${number(read)} characters, about ${number(approxTokens(read))} tokens`,
      outcome: running?.kind === kind ? 'Running…' : result!.ok ? result!.outcome : `Stopped: ${result!.outcome}`
    };
  };
  const clicking = column('clicking');
  const withToolsColumn = column('tools');

  return (
    <div className="ws-agent">
      <h3>What an agent reads here</h3>
      <p className="ws-muted">
        Without WebMCP, an agent works from a snapshot of the page, and takes a new one after every click. With WebMCP, it reads the tool list once.
      </p>
      <Size label="This page, as a snapshot" snapshot={page} />
      {webmcpSupported() ? (
        <Size label={`The tools (${tools.length})`} snapshot={tools.length ? toolList : { text: '', lines: 0, chars: 0 }} empty="No tools are registered yet." />
      ) : (
        <p className="ws-notice">WebMCP is off in this browser, so there is no tool list. The Tools tab says how to turn it on.</p>
      )}

      <h3>One task, both ways</h3>
      <blockquote>{TASK}</blockquote>
      <p className="ws-row">
        <button type="button" className="ws-btn" data-action="replay-clicking" onClick={() => replay('clicking')} disabled={!!running}>
          Shop by clicking
        </button>
        <button type="button" className="ws-btn" data-action="replay-tools" onClick={() => replay('tools')} disabled={!!running}>
          Shop with tools
        </button>
        {running && (
          <button type="button" className="ws-btn ws-btn-quiet" onClick={() => stop.current?.abort()}>
            Stop
          </button>
        )}
        <label className="ws-check">
          <input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} /> Fast
        </label>
      </p>
      <table className="ws-compare">
        <thead>
          <tr>
            <th></th>
            <th>By clicking</th>
            <th>With tools</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Steps</th>
            <td data-result="clicking-steps">{clicking.steps}</td>
            <td data-result="tools-steps">{withToolsColumn.steps}</td>
          </tr>
          <tr>
            <th>Text read</th>
            <td>{clicking.read}</td>
            <td>{withToolsColumn.read}</td>
          </tr>
          <tr>
            <th>Ended</th>
            <td data-result="clicking-outcome">{clicking.outcome}</td>
            <td data-result="tools-outcome">{withToolsColumn.outcome}</td>
          </tr>
        </tbody>
      </table>
      <p className="ws-muted">
        Both runs are scripts, not a model, and both start by resetting the demo data and signing in. “By clicking” is the best case for a UI-driving agent: the script knows the shortest
        path and never misclicks. A real agent also spends a model call on every step.
      </p>
      {shown && (
        <>
          <p className="ws-row ws-muted">
            <span>Steps of the run:</span>
            {(['clicking', 'tools'] as const).map((kind) => (
              <button key={kind} type="button" className="ws-btn ws-btn-quiet" aria-pressed={shown === kind} onClick={() => setShown(kind)}>
                {kind === 'clicking' ? 'By clicking' : 'With tools'}
              </button>
            ))}
          </p>
          <StepList steps={live} />
        </>
      )}
    </div>
  );
}
