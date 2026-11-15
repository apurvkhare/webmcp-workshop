/**
 * The opening task of the workshop, done twice by a script. No model is involved.
 *
 *   byClicking  what a UI-driving agent does: read a snapshot of the page, act on one element, read again.
 *               This is its best case: the script already knows the shortest path and never misclicks.
 *   withTools   what an agent with WebMCP does: read the tool list once, then call tools.
 *
 * Both count steps and how much text the agent had to read to take them. They show the shape of the
 * two approaches. They are not a benchmark.
 */
import type { ShopApp } from '../client/shop.ts';
import { navigate } from '../ui/router.ts';
import { describeTools, snapshotPage } from './snapshot.ts';

export const TASK =
  'Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot.';

export type ReplayKind = 'clicking' | 'tools';

export interface ReplayStep {
  action: string;
  /** Characters the agent read to take this step: a page snapshot, the tool list, or a tool result. */
  read: number;
  detail?: string;
}

export interface ReplayResult {
  kind: ReplayKind;
  ok: boolean;
  steps: ReplayStep[];
  charsRead: number;
  /** How it ended: the order id, or why it stopped. */
  outcome: string;
  at: string;
}

export interface ReplayOptions {
  /** Milliseconds between steps, so the room can follow. */
  pace: number;
  onStep(steps: ReplayStep[]): void;
  signal: AbortSignal;
}

class Stopped extends Error {}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Stopped('Stopped.'));
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => (clearTimeout(timer), reject(new Stopped('Stopped.'))), { once: true });
  });

async function waitFor<T>(find: () => T | null | undefined | false, what: string, signal: AbortSignal, timeout = 6000): Promise<T> {
  const started = performance.now();
  for (;;) {
    const found = find();
    if (found) return found;
    if (performance.now() - started > timeout) throw new Error(`Gave up waiting for ${what}.`);
    await sleep(50, signal);
  }
}

const shopRoot = () => document.getElementById('root')!;
const one = <T extends Element = HTMLElement>(selector: string) => shopRoot().querySelector<T>(selector) ?? document.querySelector<T>(`dialog[open] ${selector}`);

function flash(el: Element) {
  el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
  el.classList.add('ws-replay-target');
  setTimeout(() => el.classList.remove('ws-replay-target'), 700);
}

/** Sets a field the way typing or picking does, so React notices. */
function setValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function prepare(shop: ShopApp, signal: AbortSignal) {
  // Start the same way every time: a signed-in shopper with a saved address, an empty cart, on the home page.
  await shop.reset();
  await shop.signIn();
  navigate('/');
  await sleep(300, signal);
}

async function run(kind: ReplayKind, shop: ShopApp, options: ReplayOptions, script: (act: Act) => Promise<string>): Promise<ReplayResult> {
  const steps: ReplayStep[] = [];
  const act: Act = async (action, read, perform, detail) => {
    steps.push({ action, read, detail });
    options.onStep([...steps]);
    await perform?.();
    await sleep(options.pace, options.signal);
  };
  let ok = false;
  let outcome: string;
  try {
    await prepare(shop, options.signal);
    outcome = await script(act);
    ok = true;
  } catch (error) {
    outcome = error instanceof Error ? error.message : String(error);
  }
  return { kind, ok, steps, charsRead: steps.reduce((sum, s) => sum + s.read, 0), outcome, at: new Date().toISOString() };
}

type Act = (action: string, read: number, perform?: () => void | Promise<void>, detail?: string) => Promise<void>;

// ------------------------------------------------------------- by clicking

export function byClicking(shop: ShopApp, options: ReplayOptions): Promise<ReplayResult> {
  const { signal } = options;
  /** Every UI step starts with the agent reading the page as it is now. */
  const look = () => snapshotPage().chars;
  const el = <T extends Element = HTMLElement>(selector: string, what: string) => waitFor(() => one<T>(selector), what, signal);

  return run('clicking', shop, options, async (act) => {
    const step = async (action: string, selector: string, what: string, perform: (target: HTMLElement) => void) => {
      const target = await el(selector, what);
      const read = look();
      flash(target);
      await act(action, read, () => perform(target));
    };
    const productLink = (id: string) => `article[data-product-id="${id}"] a[href="/product/${id}"]`;

    await step('Type "wireless headphones" in the search box and submit', '#site-search', 'the search box', (input) => {
      setValue(input as HTMLInputElement, 'wireless headphones');
      (input as HTMLInputElement).form!.requestSubmit();
    });
    await step('Drag the price slider down to ₹5,000', '#filters [name="maxPrice"]', 'the price filter', (input) => setValue(input as HTMLInputElement, '5000'));
    await step('Set the rating filter to 4 and up', '#filters [name="minRating"]', 'the rating filter', (select) => setValue(select as HTMLSelectElement, '4'));
    // The cards show the rating but not the colours, so the agent opens products, best rated first, until one comes in black.
    await step('Open the best-rated result (4.7) to see its colours', productLink('hp-103'), 'the Dhwani Bass 500 card', (link) => link.click());
    await step('It comes in blue and red only. Go back to the results', '[name="colour"]', 'the colour choices', () => history.back());
    await step('Open the next best (4.6)', productLink('hp-102'), 'the Tarang Studio Pro card', (link) => link.click());
    await step('Choose the colour black', '[name="colour"][value="black"]', 'the black colour option', (radio) => radio.click());
    await step('Press "Add to cart"', '[data-action="add-to-cart"]', 'the Add to cart button', (button) => button.click());
    await waitFor(() => shop.getState().cart.itemCount === 1, 'the cart to update', signal);
    await step('Open the cart', '[data-action="open-cart"]', 'the cart link', (link) => link.click());
    await step('Open "Have a coupon?"', 'details.coupon > summary', 'the coupon section', (summary) => summary.click());
    await step('Type DEVFEST10 in the coupon field', 'details.coupon [name="coupon"]', 'the coupon field', (input) => setValue(input as HTMLInputElement, 'DEVFEST10'));
    await step('Press "Apply"', '[data-action="apply-coupon"]', 'the Apply button', (button) => button.click());
    await waitFor(() => shop.getState().cart.coupon, 'the coupon to apply', signal);
    await step('Press "Proceed to checkout"', '[data-action="checkout"]', 'the checkout button', (button) => button.click());
    await step('The saved address is filled in. Press "Save and continue"', 'form.address-form button[type="submit"]', 'the address form', (button) => button.click());
    await step('Choose the earliest delivery slot', '[name="slot"]', 'the delivery slots', (radio) => radio.click());
    await step('Press "Continue"', '[data-action="choose-slot"]', 'the Continue button', (button) => button.click());
    await step('Read the order summary and press "Place order"', '[data-action="place-order"]', 'the Place order button', (button) => button.click());
    const heading = await waitFor(() => (/^\/orders\/NB-/.test(location.pathname) ? one('h1') : null), 'the order confirmation', signal);
    await act('Read the confirmation page', look());
    return heading.textContent?.trim() ?? 'Order placed.';
  });
}

// -------------------------------------------------------------- with tools

export function withTools(shop: ShopApp, options: ReplayOptions): Promise<ReplayResult> {
  return run('tools', shop, options, async (act) => {
    if (!('modelContext' in document)) throw new Error('WebMCP is off in this browser, so the page has no tools.');
    // Signing in registers the order tools (from step 5.1 on). Give that a moment.
    await sleep(300, options.signal);
    const tools = await document.modelContext.getTools();
    if (!tools.length) throw new Error('This page registers no tools yet. That starts in step 2.1.');
    await act(`Read the tool list: ${tools.length} tool${tools.length === 1 ? '' : 's'}`, describeTools(tools).chars);

    const call = async (name: string, input: Record<string, unknown>, why: string) => {
      const tool = (await document.modelContext.getTools()).find((t) => t.name === name);
      if (!tool) throw new Error(`There is no ${name} tool yet, so the agent is stuck here.`);
      const result = (await document.modelContext.executeTool(tool, input, { signal: options.signal })) ?? '';
      await act(`${name}(${JSON.stringify(input)})`, result.length, undefined, why);
      if (result.startsWith('Error:')) throw new Error(`${name} answered: ${result}`);
      return result;
    };

    const found = JSON.parse(await call('search_products', { query: 'wireless headphones', maxPrice: 5000, minRating: 4 }, 'One call does the search and both filters')) as {
      id: string;
      rating: number;
      colours: string[];
      inStock: boolean;
    }[];
    // The model's reasoning, done here by a line of code: the best rated one that comes in black.
    const pick = found.filter((p) => p.colours.includes('black') && p.inStock).sort((a, b) => b.rating - a.rating)[0];
    if (!pick) throw new Error('No result comes in black.');
    await call('add_to_cart', { productId: pick.id, colour: 'black' }, 'The colours were in the search result, so no product page is opened');
    await call('apply_coupon', { code: 'DEVFEST10' }, 'No hunting for the coupon field');
    const slots = JSON.parse(await call('get_delivery_slots', {}, 'Earliest first')) as { id: string }[];
    const placed = await call('place_order', { slotId: slots[0]!.id }, 'The page asks you to confirm. Press the button in the dialog.');
    if (!/NB-\d+/.test(placed)) throw new Error(placed);
    return placed;
  });
}
