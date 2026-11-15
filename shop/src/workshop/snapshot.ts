/**
 * What an agent has to read to use this page without WebMCP: a text snapshot of the accessibility tree.
 * This is an approximation, built from the DOM, of what tools such as Chrome DevTools MCP's take_snapshot
 * hand to a model: one line per element that has a role or text, with its name and state.
 * The workshop drawer itself is left out.
 */

const ROLES: Record<string, string> = {
  a: 'link',
  button: 'button',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  nav: 'navigation',
  main: 'main',
  header: 'banner',
  footer: 'contentinfo',
  form: 'form',
  ul: 'list',
  ol: 'list',
  li: 'listitem',
  img: 'image',
  svg: 'image',
  select: 'combobox',
  option: 'option',
  textarea: 'textbox',
  article: 'article',
  dialog: 'dialog',
  fieldset: 'group',
  table: 'table',
  tr: 'row',
  td: 'cell',
  th: 'columnheader',
  details: 'group',
  summary: 'button',
  output: 'status',
  section: 'region'
};

const INPUT_ROLES: Record<string, string> = {
  checkbox: 'checkbox',
  radio: 'radio',
  range: 'slider',
  number: 'spinbutton',
  search: 'searchbox',
  submit: 'button',
  button: 'button'
};

const SKIP = new Set(['script', 'style', 'template', 'noscript', 'path', 'circle', 'rect', 'g', 'defs', 'line', 'ellipse', 'polygon', 'polyline']);

function roleOf(el: Element): string | undefined {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input') return INPUT_ROLES[(el as HTMLInputElement).type] ?? 'textbox';
  if (tag === 'a' && !el.hasAttribute('href')) return undefined;
  if (tag === 'section' && !el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) return undefined;
  return ROLES[tag];
}

const clean = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();

function nameOf(el: Element, role: string): string {
  const label = el.getAttribute('aria-label');
  if (label) return clean(label);
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) return clean(labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' '));
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    const labels = [...(el.labels ?? [])].map((l) => clean(l.textContent)).filter(Boolean);
    return labels.join(' ') || clean(el.getAttribute('placeholder')) || clean(el.getAttribute('title'));
  }
  if (el instanceof HTMLFieldSetElement) return clean(el.querySelector('legend')?.textContent);
  if (el instanceof HTMLImageElement) return clean(el.alt);
  if (el instanceof SVGElement) return clean(el.querySelector('title')?.textContent);
  // Links, buttons, headings and options are named by their own text.
  if (['link', 'button', 'heading', 'option', 'tab', 'menuitem'].includes(role)) return clean(el.textContent);
  return '';
}

function stateOf(el: Element): string {
  const parts: string[] = [];
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') {
      if (el.checked) parts.push('checked');
    } else if (el.value) parts.push(`value="${clean(el.value)}"`);
    if (el.type === 'range' || el.type === 'number') {
      if (el.min) parts.push(`min=${el.min}`);
      if (el.max) parts.push(`max=${el.max}`);
    }
    if (el.required) parts.push('required');
  }
  if (el instanceof HTMLSelectElement) parts.push(`value="${clean(el.selectedOptions[0]?.textContent)}"`);
  if (el instanceof HTMLOptionElement && el.selected) parts.push('selected');
  if (el instanceof HTMLTextAreaElement && el.value) parts.push(`value="${clean(el.value)}"`);
  if ((el as HTMLButtonElement).disabled) parts.push('disabled');
  if (/^h[1-6]$/i.test(el.tagName)) parts.push(`level=${el.tagName[1]}`);
  if (el instanceof HTMLAnchorElement && el.getAttribute('href')) parts.push(`url="${el.getAttribute('href')}"`);
  for (const attr of ['aria-current', 'aria-expanded', 'aria-pressed', 'aria-selected']) {
    const value = el.getAttribute(attr);
    if (value && value !== 'false') parts.push(`${attr.slice(5)}=${value}`);
  }
  if (el instanceof HTMLDetailsElement) parts.push(el.open ? 'expanded' : 'collapsed');
  return parts.join(' ');
}

function hidden(el: Element): boolean {
  if (el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('hidden')) return true;
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
  }
  // The content of a closed <details> isn't in the accessibility tree.
  const details = el.parentElement instanceof HTMLDetailsElement ? el.parentElement : null;
  return !!details && !details.open && el.tagName.toLowerCase() !== 'summary';
}

export interface Snapshot {
  text: string;
  lines: number;
  chars: number;
}

/** Characters to tokens, as a rough rule: about four characters per token for English text and JSON. */
export const approxTokens = (chars: number) => Math.round(chars / 4);

export function snapshotPage(root: Element = document.body): Snapshot {
  const lines: string[] = [];
  let uid = 0;

  const walk = (node: Node, depth: number, namedByAncestor: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = clean(node.textContent);
      if (text && !namedByAncestor) lines.push(`${'  '.repeat(depth)}uid=${++uid} StaticText "${text}"`);
      return;
    }
    if (!(node instanceof Element)) return;
    const tag = node.tagName.toLowerCase();
    if (SKIP.has(tag) || node.id === 'workshop' || hidden(node)) return;

    const role = roleOf(node);
    let childDepth = depth;
    let named = namedByAncestor;
    if (role) {
      const name = nameOf(node, role);
      const state = stateOf(node);
      lines.push(`${'  '.repeat(depth)}uid=${++uid} ${role}${name ? ` "${name}"` : ''}${state ? ` ${state}` : ''}`);
      childDepth = depth + 1;
      // A link's or button's text is already its name: listing it again as StaticText would count it twice.
      named = named || (['link', 'button', 'heading', 'option'].includes(role) && !!name);
    }
    if (tag === 'svg') return;
    for (const child of node.childNodes) walk(child, childDepth, named);
  };

  walk(root, 0, false);
  const text = lines.join('\n');
  return { text, lines: lines.length, chars: text.length };
}

/** The tool list as an agent receives it: names, descriptions, schemas and annotations, as JSON. */
export function describeTools(tools: RegisteredTool[]): Snapshot {
  const text = JSON.stringify(
    tools.map((t) => ({
      name: t.name,
      ...(t.title ? { title: t.title } : {}),
      description: t.description,
      ...(t.inputSchema ? { inputSchema: t.inputSchema } : {}),
      ...(t.annotations ? { annotations: Object.fromEntries(Object.entries(t.annotations).filter(([, on]) => on)) } : {})
    })),
    null,
    1
  );
  return { text, lines: text.split('\n').length, chars: text.length };
}
