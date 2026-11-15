/**
 * npm run doctor [--json]
 *
 * Checks this machine is ready for the workshop: Node, dependencies, a free port, Chrome with WebMCP,
 * and the finished app's tests. Run it a few days before, on the network you'll install from.
 * After it passes once, the workshop runs offline.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { print, runTests } from './lib.ts';
import { ROOT, wantsJson } from './steps.ts';

const json = wantsJson();
type Status = 'ok' | 'warn' | 'fail';
/** `fix` shows when a check isn't ok; `note` always shows. */
const checks: { name: string; status: Status; detail: string; fix?: string; note?: string }[] = [];
const check = (name: string, status: Status, detail: string, fix?: string, note?: string) => checks.push({ name, status, detail, fix, note });

// Node
const [nodeMajor = 0, nodeMinor = 0] = process.versions.node.split('.').map(Number);
const nodeOk = nodeMajor > 20 || (nodeMajor === 20 && nodeMinor >= 19);
check('Node 20.19 or later', nodeOk ? 'ok' : 'fail', `node ${process.versions.node}`, 'Install Node 22 LTS from https://nodejs.org, or run: nvm install 22');

// Dependencies: present, and at the pinned version where package.json pins one
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as Record<string, Record<string, string> | undefined>;
const wanted = { ...pkg.dependencies, ...pkg.devDependencies };
const wrong = Object.entries(wanted).flatMap(([name, want]) => {
  const file = resolve(ROOT, 'node_modules', name, 'package.json');
  if (!existsSync(file)) return [`${name} missing`];
  const have = (JSON.parse(readFileSync(file, 'utf8')) as { version: string }).version;
  return /^\d/.test(want) && have !== want ? [`${name} ${have}, want ${want}`] : [];
});
check('Dependencies installed', wrong.length ? 'fail' : 'ok', wrong.length ? wrong.join('; ') : `${Object.keys(wanted).length} packages present`, 'npm install');

// Port
const free = (port: number) =>
  new Promise<boolean>((done) => {
    const server = createServer().once('error', () => done(false));
    server.listen(port, () => server.close(() => done(true)));
  });
const portFree = await free(5173);
check(
  'Port 5173 free (the shop)',
  portFree ? 'ok' : 'fail',
  portFree ? 'free' : 'in use',
  "Stop whatever uses port 5173 (an earlier npm start: press Ctrl+C in that terminal), or use another port: npm start -- --port 5174"
);

// Chrome. Only a warning: it isn't always where we look.
const MIN_CHROME = 155;
const FLAGS = 'Enable chrome://flags/#enable-webmcp-testing (and #devtools-webmcp-support if it is listed), then relaunch Chrome.';

function chromeVersion(): { path: string; version?: string } | undefined {
  const versionOf = (path: string) => {
    if (process.platform === 'win32') {
      // Don't launch it: chrome.exe sits next to a folder named after its version.
      const folder = readdirSync(dirname(path)).filter((f) => /^\d+\.\d+\.\d+\.\d+$/.test(f)).sort(compareVersions).at(-1);
      return folder;
    }
    const out = spawnSync(path, ['--version'], { encoding: 'utf8', timeout: 10_000 });
    return /(\d+\.\d+\.\d+\.\d+)/.exec(out.stdout ?? '')?.[1];
  };
  const candidates: string[] = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);
  if (process.platform === 'darwin') {
    for (const name of ['Google Chrome', 'Google Chrome Beta', 'Google Chrome Canary']) {
      candidates.push(`/Applications/${name}.app/Contents/MacOS/${name}`);
    }
  } else if (process.platform === 'win32') {
    for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
      if (base) for (const app of ['Chrome', 'Chrome Beta', 'Chrome SxS']) candidates.push(join(base, 'Google', app, 'Application', 'chrome.exe'));
    }
  } else {
    for (const name of ['google-chrome', 'google-chrome-stable', 'google-chrome-beta', 'google-chrome-unstable']) {
      const which = spawnSync('which', [name], { encoding: 'utf8' });
      if (which.status === 0 && which.stdout.trim()) candidates.push(which.stdout.trim());
    }
  }
  // Prefer the newest one found: Beta or Canary may be the only one new enough.
  const found = candidates
    .filter((path) => existsSync(path))
    .map((path) => {
      try {
        return { path, version: versionOf(path) };
      } catch {
        return { path, version: undefined };
      }
    });
  return found.sort((a, b) => compareVersions(a.version ?? '0', b.version ?? '0')).at(-1);
}

function compareVersions(a: string, b: string) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

const chrome = chromeVersion();
const chromeMajor = Number(chrome?.version?.split('.')[0] ?? 0);
check(
  `Chrome ${MIN_CHROME} or later`,
  chromeMajor >= MIN_CHROME ? 'ok' : 'warn',
  !chrome ? 'not found' : chrome.version ? `Chrome ${chrome.version}` : `found at ${chrome.path}, version unknown`,
  !chrome
    ? `Install Chrome ${MIN_CHROME} or later (Beta or Canary if stable is older), or point CHROME_PATH at it.`
    : 'Update Chrome, or install Chrome Beta or Canary. If this version is wrong, ignore this.',
  // The flags can't be checked from here, so the reminder always shows.
  FLAGS
);

// Tests
const tests = await runTests([resolve(ROOT, 'app')]).catch(() => []);
const failing = tests.filter((t) => !t.passed);
check('The finished app passes its tests', tests.length && !failing.length ? 'ok' : 'fail', tests.length ? `${tests.length - failing.length}/${tests.length} test files pass in app/` : 'no tests ran', 'npx vitest run app/tests');

const failed = checks.filter((c) => c.status === 'fail');
const icon = { ok: '✓', warn: '!', fail: '✗' };
print(json, { ok: failed.length === 0, checks }, () =>
  [
    ...checks.map((c) => `${icon[c.status]} ${c.name.padEnd(34)} ${c.detail}${c.status !== 'ok' && c.fix ? `\n    → ${c.fix}` : ''}${c.note ? `\n    → ${c.note}` : ''}`),
    '',
    failed.length ? `${failed.length} problem${failed.length === 1 ? '' : 's'} to fix before the workshop.` : 'Ready for the workshop. Everything from here on works offline.'
  ].join('\n')
);
process.exit(failed.length ? 1 : 0);
