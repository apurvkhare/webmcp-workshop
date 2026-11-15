/**
 * npm run verify [--chrome] [--json]
 *
 * For workshop authors: checks every step folder before the event.
 *   - the exercise folders match scripts/authoring/source (npm run cut was run)
 *   - every folder typechecks against the shop, problems included
 *   - each solution passes its own tests and every earlier step's
 *   - each problem fails its own step's tests, passes the earlier ones, and has 🔨 markers; solutions have none
 *   - every step folder has a README.md
 *   - with --chrome, scripts/verify-chrome.ts runs the steps in a real Chrome
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { findMarkers, print, runTests } from './lib.ts';
import { ROOT, STEPS, wantsJson } from './steps.ts';

const json = wantsJson();
const problems: string[] = [];
const run = (cmd: string, args: string[], env: Record<string, string> = {}) =>
  spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...env }, shell: process.platform === 'win32' });
const say = (line: string) => !json && console.log(line);

say('Checking the exercises match the authoring source …');
const cut = run('npx', ['tsx', 'scripts/authoring/cut.ts', '--check']);
if (cut.status !== 0) problems.push(`exercises are out of date with scripts/authoring/source: ${cut.stdout.trim()} Run npm run cut.`);

const folders = [...STEPS.flatMap((s) => [s.dir('problem'), s.dir('solution')]), join(ROOT, 'app')];

/** Each folder is typechecked as the app the shop imports: `@app/*` points at it, with shop/src alongside. */
async function typecheck(dir: string) {
  const tmp = await mkdtemp(join(ROOT, '.verify-tsconfig-'));
  const config = join(tmp, 'tsconfig.json');
  const rel = (p: string) => relative(tmp, p) || '.';
  await writeFile(
    config,
    JSON.stringify(
      {
        extends: rel(join(ROOT, 'tsconfig.json')),
        // No baseUrl: paths resolve from this file's folder.
        compilerOptions: {
          paths: {
            '@shop': [rel(join(ROOT, 'shop/src/index.ts'))],
            '@shop/testing': [rel(join(ROOT, 'shop/src/testing/index.ts'))],
            '@app/*': [`${rel(dir)}/*`]
          }
        },
        include: [rel(dir), rel(join(ROOT, 'shop/src'))],
        exclude: [rel(join(dir, 'node_modules'))]
      },
      null,
      2
    )
  );
  try {
    return run('npx', ['tsc', '-p', relative(ROOT, config)]);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

say('Typechecking …');
for (const dir of folders) {
  if (!existsSync(dir)) continue;
  const tsc = await typecheck(dir);
  if (tsc.status !== 0) problems.push(`${relative(ROOT, dir)}: typecheck failed:\n${tsc.stdout.trim()}`);
}

say('Running every folder’s tests …');
const results = await runTests(folders);
const byFolder = (dir: string) => results.filter((r) => r.folder === relative(ROOT, dir));

for (const step of STEPS) {
  for (const kind of ['problem', 'solution'] as const) {
    const dir = step.dir(kind);
    const name = relative(ROOT, dir);
    if (!existsSync(join(dir, 'README.md'))) problems.push(`${name}: no README.md`);
    const own = byFolder(dir).filter((r) => r.step === step.id);
    const earlier = byFolder(dir).filter((r) => r.step !== step.id);
    if (!own.length) problems.push(`${name}: no tests/${step.id}.test.ts`);
    for (const r of earlier.filter((r) => !r.passed)) problems.push(`${name}: earlier step ${r.step} fails: ${r.failures[0]?.message}`);
    const todo = await findMarkers(dir, ['🔨']);
    if (kind === 'solution') {
      for (const r of own.filter((r) => !r.passed)) problems.push(`${name}: fails its own tests: ${r.failures.map((f) => f.name).join('; ')}`);
      if (todo.length) problems.push(`${name}: solution still has 🔨 at ${todo.map((m) => `${m.file}:${m.line}`).join(', ')}`);
    } else {
      if (own.some((r) => r.passed)) problems.push(`${name}: the problem already passes its own tests`);
      if (!todo.length) problems.push(`${name}: problem has no 🔨 markers`);
    }
  }
}
for (const r of byFolder(join(ROOT, 'app')).filter((r) => !r.passed)) problems.push(`app: step ${r.step} fails: ${r.failures[0]?.message}`);

let chrome: number | null = null;
if (process.argv.includes('--chrome')) {
  say('Running the steps in Chrome …');
  const result = spawnSync('npx', ['tsx', 'scripts/verify-chrome.ts', ...(json ? ['--json'] : [])], {
    cwd: ROOT,
    stdio: json ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });
  chrome = result.status ?? 1;
  if (chrome !== 0) problems.push(`scripts/verify-chrome.ts failed (exit ${chrome})${json && result.stdout ? `: ${result.stdout.trim()}` : ''}`);
}

print(json, { ok: problems.length === 0, steps: STEPS.length, testFiles: results.length, chrome, problems }, () =>
  problems.length ? `\n${problems.length} problem(s):\n${problems.map((p) => `✗ ${p}`).join('\n')}` : `\nAll ${STEPS.length} steps verified (${results.length} test files).`
);
process.exit(problems.length ? 1 : chrome ?? 0);
