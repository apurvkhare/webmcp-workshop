/**
 * Serves the workshop drawer's Guide tab: which step is loaded and its README.
 *   GET /__workshop/guide    the current step, its README (Markdown) and the list of every step
 * When `npm run go` loads another step, open pages reload. When only the README changes, they get a
 * "workshop:guide" event on Vite's socket and fetch it again.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { STEPS, type Kind } from '../../../scripts/steps.ts';

export interface Guide {
  /** The folder the shop loaded its WebMCP code from, relative to the repo: "playground", "app", … */
  appDir: string;
  step: { id: string; title: string; kind: Kind; section: string } | null;
  readme: string | null;
  steps: { id: string; title: string; section: string }[];
}

export function workshopGuide(root: string, appDir: string): Plugin {
  const stateFile = resolve(appDir, '.step.json');
  const readme = resolve(appDir, 'README.md');

  const currentStep = (): Guide['step'] => {
    let id: string | undefined;
    let kind: Kind = 'problem';
    if (existsSync(stateFile)) {
      try {
        ({ step: id, kind } = JSON.parse(readFileSync(stateFile, 'utf8')) as { step: string; kind: Kind });
      } catch {
        // Half-written while `npm run go` runs. The next poll reads it whole.
      }
    } else {
      // An exercise folder served directly: npm start -- --app exercises/…
      const found = STEPS.flatMap((s) => (['problem', 'solution'] as const).map((k) => ({ s, k }))).find(({ s, k }) => s.dir(k) === appDir);
      if (found) [id, kind] = [found.s.id, found.k];
    }
    const step = STEPS.find((s) => s.id === id);
    return step ? { id: step.id, title: step.title, kind, section: `${step.section.n} · ${step.section.title}` } : null;
  };

  const guide = (): Guide => ({
    appDir: relative(root, appDir),
    step: currentStep(),
    readme: existsSync(readme) ? readFileSync(readme, 'utf8') : null,
    steps: STEPS.map((s) => ({ id: s.id, title: s.title, section: `${s.section.n} · ${s.section.title}` }))
  });

  const mtime = (file: string) => (existsSync(file) ? statSync(file).mtimeMs : 0);
  const stamps = () => ({ step: mtime(stateFile), readme: mtime(readme) });

  return {
    name: 'workshop-guide',
    configureServer(server) {
      server.middlewares.use('/__workshop/guide', (_req, res) => {
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('cache-control', 'no-store');
        res.end(JSON.stringify(guide()));
      });
      // Tell open pages when `npm run go` loads another step, or the README is edited. This rides on Vite's own
      // socket, so a tab holds no second connection. Polling, because `npm run go` deletes and recreates the folder.
      let last = stamps();
      const timer = setInterval(() => {
        const now = stamps();
        if (now.step !== last.step) server.ws.send({ type: 'full-reload' });
        else if (now.readme !== last.readme) server.ws.send({ type: 'custom', event: 'workshop:guide' });
        last = now;
      }, 1000);
      timer.unref();
      server.httpServer?.once('close', () => clearInterval(timer));
    }
  };
}
