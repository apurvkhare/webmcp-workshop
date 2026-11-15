/**
 * npm run codelab [--check] [--json]
 *
 * Writes CODELAB.md: the whole workshop as one page to read top to bottom, for anyone doing it alone.
 * It joins SETUP.md, the "How the workshop works" part of README.md (between <!-- codelab:start -->
 * and <!-- codelab:end -->), then each section's README.md, its steps' problem READMEs and its FINISHED.md.
 * Headings move down one level and relative links are rewritten to work from the repo root.
 * `--check` writes nothing and exits 1 if CODELAB.md is out of date.
 */
import { existsSync, readdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fail, print } from './lib.ts';
import { ROOT, wantsJson } from './steps.ts';

const json = wantsJson();
const CHECK = process.argv.includes('--check');
const OUT = resolve(ROOT, 'CODELAB.md');
const TITLE = 'Hands-on WebMCP: the codelab';

interface Part {
  /** Repo-relative path of the file it came from. */
  from: string;
  /** 0 for top-level parts, 1 for a section's steps and FINISHED.md: only used to indent the contents. */
  depth: number;
  body: string;
}

const FENCE = /^\s*(```|~~~)/;

/** Applies `fn` to every line outside code fences. */
function mapProse(text: string, fn: (line: string) => string) {
  let fenced = false;
  return text
    .split('\n')
    .map((line) => {
      if (FENCE.test(line)) {
        fenced = !fenced;
        return line;
      }
      return fenced ? line : fn(line);
    })
    .join('\n');
}

const demote = (text: string, by: number) => mapProse(text, (line) => line.replace(/^(#{1,6})(?=\s)/, (h) => '#'.repeat(Math.min(6, h.length + by))));

const isRelative = (url: string) => !/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(url);

/** Rewrites a link written relative to `fromDir` so it works from the repo root. Leaves URLs, anchors and absolute paths alone. */
function rebase(url: string, fromDir: string) {
  if (!isRelative(url)) return url;
  const [path = '', hash] = url.split(/(?=#)/);
  const rel = relative(ROOT, resolve(fromDir, path)).split('\\').join('/');
  return (rel || '.') + (hash ?? '');
}

/** Markdown links and images, reference definitions, and href/src attributes. Inline code is left alone. */
function rewriteLinks(text: string, fromDir: string) {
  return mapProse(text, (line) =>
    line
      .split(/(`[^`]*`)/)
      .map((chunk, i) =>
        i % 2
          ? chunk
          : chunk
              .replace(/(\]\()(<?)([^)\s>]+)(>?)/g, (_, open, lt, url, gt) => `${open}${lt}${rebase(url, fromDir)}${gt}`)
              .replace(/^(\s{0,3}\[[^\]]+\]:\s*)(\S+)/, (_, def, url) => `${def}${rebase(url, fromDir)}`)
              .replace(/\b(href|src)=(["'])([^"']+)\2/g, (_, attr, q, url) => `${attr}=${q}${rebase(url, fromDir)}${q}`)
      )
      .join('')
  );
}

async function part(path: string, depth: number, by = 1): Promise<Part | undefined> {
  if (!existsSync(path)) return undefined;
  const text = (await readFile(path, 'utf8')).trim();
  return { from: relative(ROOT, path), depth, body: demote(rewriteLinks(text, dirname(path)), by) };
}

/** The README's "How the workshop works" block, under a heading of its own. Skipped if the markers aren't there. */
async function howItWorks(): Promise<Part | undefined> {
  const path = resolve(ROOT, 'README.md');
  if (!existsSync(path)) return undefined;
  const m = /<!--\s*codelab:start\s*-->([\s\S]*?)<!--\s*codelab:end\s*-->/.exec(await readFile(path, 'utf8'));
  if (!m) return undefined;
  let block = rewriteLinks(m[1]!.trim(), ROOT);
  // Drop the block's own title if it has one, then put its headings under ours.
  block = block.replace(/^#{1,6}\s+How the workshop works\s*\n+/i, '');
  const levels: number[] = [];
  mapProse(block, (line) => {
    const h = /^(#{1,6})\s/.exec(line);
    if (h) levels.push(h[1]!.length);
    return line;
  });
  const by = levels.length ? 3 - Math.min(...levels) : 0;
  return { from: 'README.md', depth: 0, body: `## How the workshop works\n\n${demote(block, by)}` };
}

const dirs = (dir: string, pattern: RegExp) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && pattern.test(e.name))
        .map((e) => join(dir, e.name))
        .sort()
    : [];

const parts: Part[] = [];
const add = (p: Part | undefined) => p && parts.push(p);

add(await part(resolve(ROOT, 'SETUP.md'), 0));
add(await howItWorks());
for (const section of dirs(resolve(ROOT, 'exercises'), /^\d{2}\./)) {
  add(await part(join(section, 'README.md'), 0));
  for (const step of dirs(section, /^\d{2}\.problem\./)) add(await part(join(step, 'README.md'), 1));
  add(await part(join(section, 'FINISHED.md'), 1));
}

if (!parts.length) fail(json, 'Nothing to put in the codelab: no SETUP.md, README.md block or exercises/*/README.md yet.');

// ------------------------------------------------------------- contents

/** GitHub's heading anchors: lowercase, punctuation and emoji dropped, spaces to hyphens, repeats numbered. */
const seen = new Map<string, number>();
function anchor(heading: string) {
  const base = heading
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n ? `${base}-${n}` : base;
}

anchor(TITLE);
anchor('Contents');
const toc: string[] = [];
for (const p of parts) {
  // Every heading gets an anchor, in order, so repeats are numbered the way GitHub numbers them.
  mapProse(p.body, (line) => {
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) {
      const id = anchor(h[2]!);
      if (h[1]!.length === 2) toc.push(`${'  '.repeat(p.depth)}- [${h[2]!.replace(/[[\]]/g, '')}](#${id})`);
    }
    return line;
  });
}

const notice = [
  '<!-- Generated by `npm run codelab` from SETUP.md, README.md and exercises/**/README.md. Do not edit: change those files and run it again. -->',
  '',
  `# ${TITLE}`,
  '',
  '> This page is generated from the workshop repo, so it matches the steps you load with `npm run go`. Edit the source files, not this one.',
  '',
  '## Contents',
  '',
  ...toc
].join('\n');

const text = `${[notice, ...parts.map((p) => `<!-- from ${p.from} -->\n\n${p.body}`)].join('\n\n---\n\n')}\n`;

// --------------------------------------------------------------- output

const current = existsSync(OUT) ? await readFile(OUT, 'utf8') : undefined;
const stale = current !== text;
if (CHECK) {
  print(json, { ok: !stale, file: 'CODELAB.md', stale }, () => (stale ? 'CODELAB.md is out of date. Run: npm run codelab' : 'CODELAB.md is up to date.'));
  process.exit(stale ? 1 : 0);
}
if (stale) await writeFile(OUT, text);
print(json, { ok: true, file: 'CODELAB.md', changed: stale, parts: parts.map((p) => p.from) }, () =>
  `${stale ? 'Wrote' : 'Unchanged:'} CODELAB.md from ${parts.length} file${parts.length === 1 ? '' : 's'}.`
);
