/**
 * The workshop's steps, in order. Every script reads this list, so a step id like "4.2" means the same
 * thing everywhere: section 04, step 02, folders exercises/04.user-control/02.problem.confirm-order and 02.solution.confirm-order.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface Section {
  n: number;
  slug: string;
  title: string;
  steps: { slug: string; title: string }[];
}

export const SECTIONS: Section[] = [
  {
    n: 2,
    slug: 'register-tools',
    title: 'Register tools',
    steps: [
      { slug: 'search-products', title: 'Register search_products with a JSON Schema' },
      { slug: 'add-to-cart', title: 'Validate input in add_to_cart' }
    ]
  },
  {
    n: 3,
    slug: 'form-tool',
    title: 'Turn a form into a tool',
    steps: [{ slug: 'address-form', title: 'Make the address form a tool' }]
  },
  {
    n: 4,
    slug: 'user-control',
    title: 'Keep the user in control',
    steps: [
      { slug: 'annotations', title: 'Say what each tool does with annotations' },
      { slug: 'confirm-order', title: 'Ask before placing an order' }
    ]
  },
  {
    n: 5,
    slug: 'tool-lifecycle',
    title: 'Tools follow state',
    steps: [{ slug: 'signed-in-tools', title: 'Register order tools only while signed in' }]
  },
  {
    n: 6,
    slug: 'observability',
    title: 'See what agents do',
    steps: [{ slug: 'log-calls', title: 'Log every tool call' }]
  }
];

export type Kind = 'problem' | 'solution';

export interface Step {
  /** "4.2" */
  id: string;
  section: Section;
  index: number;
  slug: string;
  title: string;
  /** exercises/04.user-control */
  sectionDir: string;
  dir: (kind: Kind) => string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const ROOT = resolve(import.meta.dirname, '..');
export const PLAYGROUND = resolve(ROOT, 'playground');
/** Which step the playground holds, written by `npm run go`. */
export const STATE_FILE = resolve(PLAYGROUND, '.step.json');

export const STEPS: Step[] = SECTIONS.flatMap((section) =>
  section.steps.map((s, i) => {
    const sectionDir = resolve(ROOT, 'exercises', `${pad(section.n)}.${section.slug}`);
    return {
      id: `${section.n}.${i + 1}`,
      section,
      index: i + 1,
      slug: s.slug,
      title: s.title,
      sectionDir,
      dir: (kind: Kind) => resolve(sectionDir, `${pad(i + 1)}.${kind}.${s.slug}`)
    };
  })
);

/** Accepts "4.2", "04.02", "4.2.confirm-order". Returns undefined for anything else. */
export function findStep(input: string | undefined): Step | undefined {
  const m = /^0?(\d+)\.0?(\d+)/.exec(input ?? '');
  return m ? STEPS.find((s) => s.id === `${Number(m[1])}.${Number(m[2])}`) : undefined;
}

export const compareIds = (a: string, b: string) => {
  const [a1, a2] = a.split('.').map(Number) as [number, number];
  const [b1, b2] = b.split('.').map(Number) as [number, number];
  return a1 - b1 || a2 - b2;
};

export interface PlaygroundState {
  step: string;
  kind: Kind;
  loadedAt: string;
}

export async function readState(): Promise<PlaygroundState | undefined> {
  if (!existsSync(STATE_FILE)) return undefined;
  const { readFile } = await import('node:fs/promises');
  try {
    return JSON.parse(await readFile(STATE_FILE, 'utf8')) as PlaygroundState;
  } catch {
    return undefined;
  }
}

/** Shared by every script: --json switches output to one JSON object on stdout. */
export const wantsJson = () => process.argv.includes('--json');
export const positional = () => process.argv.slice(2).filter((a) => !a.startsWith('--'));
