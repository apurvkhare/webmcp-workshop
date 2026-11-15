/**
 * npm start: run the shop on Vite's dev server, with the playground's tools and form.
 *   npm start                        the playground, on http://localhost:5173
 *   npm start -- --app app           the finished code
 *   npm start -- --app exercises/…   any exercise folder
 *   npm start -- --port 5174         another port, if 5173 is taken
 *
 * Vite reloads the page as you save, and when `npm run go` swaps the playground to another step.
 * Ctrl+C stops it. Non-interactive: safe for an agent to run in the background.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadIntoPlayground } from './lib.ts';
import { ROOT, findStep } from './steps.ts';

const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const appDir = (flag('--app') ?? 'playground').replace(/\/+$/, '');
const port = flag('--port') ?? '5173';

if (!/^\d+$/.test(port)) {
  console.error(`--port needs a number, not "${port}". For example: npm start -- --port 5174`);
  process.exit(1);
}
if (appDir === 'playground' && !existsSync(resolve(ROOT, 'playground/.step.json'))) {
  // First run: there is nothing to serve yet, so start at the beginning.
  await loadIntoPlayground(findStep('2.1')!, 'problem');
  console.log('The playground was empty, so step 2.1 is loaded into it. Read playground/README.md.');
}
if (!existsSync(resolve(ROOT, appDir, 'webmcp'))) {
  console.error(`No webmcp/ folder in ${appDir}/. Pass a step folder or app: npm start -- --app app`);
  process.exit(1);
}

console.log(`Serving the shop with ${appDir}/ on http://localhost:${port}`);
const vite = spawn('npx', ['vite', '--port', port, '--strictPort'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, APP_DIR: appDir, PORT: port },
  shell: process.platform === 'win32'
});
vite.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => vite.kill(signal));
