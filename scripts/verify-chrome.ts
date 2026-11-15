/**
 * For workshop authors: npm run verify:chrome [-- --only 4.2] [--json] [--headed]
 *
 * Runs every step's solution, and the finished app, in a real Chrome with WebMCP switched on, and checks
 * what the unit tests can't: that Chrome registers the tools, derives the form's schema, calls execute,
 * fires its events and unregisters on abort. It also runs both replays from the drawer, and checks that
 * the shop still works in a Chrome without WebMCP.
 *
 * Chrome is found in this order: CHROME_PATH, a Chrome for Testing under .chrome/
 * (npx @puppeteer/browsers install chrome@stable --path .chrome), then the installed Google Chrome.
 * It needs Chrome 155 or later.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import { ROOT, STEPS, compareIds, wantsJson } from './steps.ts';

const FEATURES = '--enable-features=WebMCP,DevToolsWebMCPSupport';
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;
const headed = args.includes('--headed');
const json = wantsJson();

function findChrome(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const walk = (dir: string): string[] =>
    existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])) : [];
  const testing = walk(resolve(ROOT, '.chrome')).find((f) => /(Google Chrome for Testing|chrome\.exe|\/chrome)$/.test(f) && !f.includes('Framework'));
  if (testing) return testing;
  const installed = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync);
  if (installed) return installed;
  throw new Error('No Chrome found. Set CHROME_PATH, or run: npx @puppeteer/browsers install chrome@stable --path .chrome');
}

// ------------------------------------------------------------ dev server

async function serve(appDir: string, port: number): Promise<ChildProcess> {
  const child = spawn('npx', ['vite', '--port', String(port), '--strictPort', '--logLevel', 'error'], {
    cwd: ROOT,
    env: { ...process.env, APP_DIR: appDir, PORT: String(port) },
    stdio: ['ignore', 'ignore', 'inherit'],
    shell: process.platform === 'win32'
  });
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      if ((await fetch(`http://localhost:${port}/api/session`)).ok) return child;
    } catch {
      // Not up yet.
    }
    if (Date.now() > deadline) {
      child.kill();
      throw new Error(`The dev server for ${appDir} did not start on port ${port}.`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }
}

// --------------------------------------------------------- page helpers

interface Ctx {
  page: Page;
  base: string;
}

type Called = { text: string | null } | { error: string } | { missing: true };

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const toolNames = (page: Page) => page.evaluate(async () => (await document.modelContext.getTools()).map((t) => t.name));
const toolInfo = (page: Page, name: string) =>
  page.evaluate(async (n) => {
    const tool = (await document.modelContext.getTools()).find((t) => t.name === n);
    return tool ? { description: tool.description, inputSchema: tool.inputSchema ?? null, annotations: tool.annotations ?? null } : null;
  }, name);

/** Calls a tool the way an agent does and waits for the answer. */
const call = (page: Page, name: string, input: Record<string, unknown> = {}) =>
  page.evaluate(
    async (n, i): Promise<Called> => {
      const tool = (await document.modelContext.getTools()).find((t) => t.name === n);
      if (!tool) return { missing: true };
      try {
        return { text: await document.modelContext.executeTool(tool, i) };
      } catch (e) {
        return { error: `${(e as Error).name}: ${(e as Error).message}` };
      }
    },
    name,
    input
  );

/** Starts a call that waits for the shopper, and leaves its promise on window.__call. */
const begin = (page: Page, name: string, input: Record<string, unknown> = {}) =>
  page.evaluate(
    async (n, i) => {
      const tool = (await document.modelContext.getTools()).find((t) => t.name === n);
      if (!tool) throw new Error(`no tool named ${n}`);
      const w = window as unknown as { __abort: AbortController; __call: Promise<unknown> };
      w.__abort = new AbortController();
      w.__call = document.modelContext.executeTool(tool, i, { signal: w.__abort.signal }).then(
        (text) => ({ text }),
        (e: Error) => ({ error: `${e.name}: ${e.message}` })
      );
    },
    name,
    input
  );
const finish = (page: Page) => page.evaluate(() => (window as unknown as { __call: Promise<Called> }).__call);

const text = (result: Called): string => {
  expect(!('missing' in result), 'the tool is not registered');
  expect(!('error' in result), `the call was rejected: ${'error' in result ? result.error : ''}`);
  return (result as { text: string | null }).text ?? '';
};

const until = (page: Page, condition: () => unknown, what: string) =>
  page.waitForFunction(condition, { timeout: 8000 }).catch(() => {
    throw new Error(`timed out waiting for ${what}`);
  });
const click = async (page: Page, selector: string) => {
  await page.waitForSelector(selector, { timeout: 8000 }).catch(() => {
    throw new Error(`no element matches ${selector}`);
  });
  await page.evaluate((s) => document.querySelector<HTMLElement>(s)!.click(), selector);
};

async function fresh({ page, base }: Ctx, path = '/') {
  await page.goto(`${base}/?drawer=off`);
  await page.evaluate(() => fetch('/api/dev/reset', { method: 'POST' }));
  await page.goto(`${base}${path}${path.includes('?') ? '&' : '?'}drawer=off`);
  await until(page, () => document.querySelector('#root')?.childElementCount, 'the shop to render');
}

async function signIn({ page }: Ctx) {
  await click(page, 'a[href^="/signin"]');
  await click(page, '[data-action="sign-in"]');
  await until(page, () => document.querySelector('[data-action="sign-out"]'), 'the shopper to be signed in');
}

const firstSlot = async (page: Page) => (JSON.parse(text(await call(page, 'get_delivery_slots'))) as { id: string }[])[0]!.id;

// ------------------------------------------------------------------ checks

interface Check {
  /** The step whose solution first has to pass this. */
  from: string;
  name: string;
  run(ctx: Ctx): Promise<void>;
}

const checks: Check[] = [
  {
    from: '2.1',
    name: 'search_products is registered with its schema, and answers',
    async run(ctx) {
      await fresh(ctx);
      const tool = await toolInfo(ctx.page, 'search_products');
      expect(tool, 'search_products is not in getTools()');
      expect(Object.keys(tool.inputSchema?.properties ?? {}).includes('maxPrice'), 'its inputSchema has no maxPrice');
      const found = JSON.parse(text(await call(ctx.page, 'search_products', { query: 'wireless headphones', maxPrice: 5000, minRating: 4 }))) as { id: string }[];
      expect(found.map((p) => p.id).sort().join() === 'hp-101,hp-102,hp-103,hp-107', `unexpected results: ${found.map((p) => p.id).join()}`);
      await until(ctx.page, () => location.pathname === '/search' && document.querySelectorAll('article.product-card').length === 4, 'the page to show the 4 results');
    }
  },
  {
    from: '2.2',
    name: 'add_to_cart validates, returns errors as text, and updates the page',
    async run(ctx) {
      await fresh(ctx);
      const tool = await toolInfo(ctx.page, 'add_to_cart');
      expect(tool?.inputSchema?.required?.includes('colour'), 'add_to_cart does not require colour');
      const wrong = text(await call(ctx.page, 'add_to_cart', { productId: 'hp-103', colour: 'black' }));
      expect(/^Error:.*blue.*red/.test(wrong), `a wrong colour answered: ${wrong}`);
      const loose = text(await call(ctx.page, 'add_to_cart', { productId: 'hp-102', colour: 'black', quantity: 'two' }));
      expect(/^Error:/.test(loose), 'Chrome passed quantity "two" through and the tool accepted it');
      const added = text(await call(ctx.page, 'add_to_cart', { productId: 'hp-102', colour: 'black' }));
      expect(added.includes('Tarang Studio Pro'), `adding answered: ${added}`);
      await until(ctx.page, () => /\b1\b/.test(document.querySelector('[data-action="open-cart"]')?.getAttribute('aria-label') ?? document.querySelector('[data-action="open-cart"]')?.textContent ?? ''), 'the cart badge to show 1');
      const coupon = text(await call(ctx.page, 'apply_coupon', { code: 'DEVFEST10' }));
      expect(coupon.includes('₹480'), `apply_coupon answered: ${coupon}`);
    }
  },
  {
    from: '3.1',
    name: 'the address form is a tool: derived schema, filled by the agent, submitted by the shopper',
    async run(ctx) {
      const { page } = ctx;
      await fresh(ctx);
      await signIn(ctx);
      text(await call(page, 'add_to_cart', { productId: 'hp-102', colour: 'black' }));
      expect(!(await toolNames(page)).includes('set_delivery_address'), 'set_delivery_address exists away from the checkout page');
      await click(page, '[data-action="open-cart"]');
      await click(page, '[data-action="checkout"]');
      await page.waitForSelector('form.address-form');
      await until(page, async () => (await document.modelContext.getTools()).some((t) => t.name === 'set_delivery_address'), 'Chrome to register the form as a tool');
      const tool = (await toolInfo(page, 'set_delivery_address'))!;
      const props = tool.inputSchema?.properties ?? {};
      expect(['fullName', 'phone', 'line1', 'city', 'pincode', 'addressType'].every((k) => k in props), `derived properties: ${Object.keys(props).join()}`);
      expect(/10-digit/.test(props.phone?.description ?? ''), `phone is described as: ${props.phone?.description}`);
      expect(props.fullName?.description === 'Full name', `fullName is described as: ${props.fullName?.description}`);
      expect((props.addressType?.enum ?? []).join() === 'home,work', 'addressType has no enum from the <select>');
      expect((tool.inputSchema?.required ?? []).includes('pincode'), 'pincode is not required');

      const events = page.evaluate(
        () => new Promise<string>((done) => document.modelContext.addEventListener('toolactivated', (e) => done(e.toolName), { once: true }))
      );
      await begin(page, 'set_delivery_address', { fullName: 'Asha Rao', phone: '9845011111', line1: '221, 12th Main, Koramangala', city: 'Bengaluru', pincode: '560034', addressType: 'work' });
      await until(page, () => (document.querySelector('form.address-form [name="pincode"]') as HTMLInputElement).value === '560034', 'Chrome to fill the form');
      expect((await events) === 'set_delivery_address', 'toolactivated did not fire for the form tool');
      expect(await page.evaluate(() => document.querySelector('form.address-form')!.matches(':tool-form-active')), 'the form does not match :tool-form-active');
      // No toolautosubmit: Chrome waits for the shopper.
      await click(page, 'form.address-form button[type="submit"]');
      const answer = text(await finish(page));
      expect(/Saved the delivery address/.test(answer) && answer.includes('560034'), `the agent was answered: ${answer}`);
      const saved = (await page.evaluate(() => fetch('/api/address').then((r) => r.json()))) as { pincode: string; addressType: string };
      expect(saved.pincode === '560034' && saved.addressType === 'work', 'the address was not saved');
    }
  },
  {
    from: '4.1',
    name: 'annotations reach the agent, and get_reviews carries the planted review',
    async run(ctx) {
      await fresh(ctx);
      for (const name of ['search_products', 'view_cart', 'get_reviews']) expect((await toolInfo(ctx.page, name))?.annotations?.readOnlyHint === true, `${name} has no readOnlyHint`);
      expect((await toolInfo(ctx.page, 'get_reviews'))?.annotations?.untrustedContentHint === true, 'get_reviews has no untrustedContentHint');
      expect(!(await toolInfo(ctx.page, 'add_to_cart'))?.annotations?.readOnlyHint, 'add_to_cart claims to be read-only');
      expect(/ignore your previous instructions/i.test(text(await call(ctx.page, 'get_reviews', { productId: 'hp-102' }))), 'the planted review is missing');
    }
  },
  {
    from: '4.2',
    name: 'place_order asks in the page: decline, cancel, then confirm',
    async run(ctx) {
      const { page } = ctx;
      await fresh(ctx);
      await signIn(ctx);
      expect((await toolInfo(page, 'place_order'))?.annotations?.consequentialHint === true, 'place_order has no consequentialHint');
      const empty = text(await call(page, 'place_order', { slotId: await firstSlot(page) }));
      expect(/^Error:.*empty/.test(empty), `an empty cart answered: ${empty}`);
      text(await call(page, 'add_to_cart', { productId: 'hp-102', colour: 'black' }));
      const slotId = await firstSlot(page);
      const open = () => page.waitForSelector('dialog.confirm-dialog[open]', { timeout: 8000 });
      const closed = () => until(page, () => !document.querySelector('dialog.confirm-dialog[open]'), 'the dialog to close');

      await begin(page, 'place_order', { slotId });
      await open();
      expect(await page.evaluate(() => document.querySelector('dialog.confirm-dialog')!.textContent!.includes('₹4,799')), 'the dialog does not show the total');
      await click(page, '[data-action="confirm-decline"]');
      const declined = text(await finish(page));
      await closed();
      expect(!/NB-\d+/.test(declined) && /nothing was ordered/.test(declined), `declining answered: ${declined}`);

      await begin(page, 'place_order', { slotId });
      await open();
      await page.evaluate(() => (window as unknown as { __abort: AbortController }).__abort.abort());
      await closed();
      const cancelled = await finish(page);
      expect('error' in cancelled, 'cancelling the call did not reject executeTool');
      expect(((await page.evaluate(() => fetch('/api/orders').then((r) => r.json()))) as unknown[]).length === 0, 'something was ordered without a yes');

      await begin(page, 'place_order', { slotId });
      await open();
      await click(page, '[data-action="confirm-accept"]');
      const placed = text(await finish(page));
      expect(/Order NB-1001 is placed/.test(placed), `confirming answered: ${placed}`);
      await until(page, () => location.pathname === '/orders/NB-1001', 'the page to show the order');
      expect(JSON.parse(text(await call(page, 'get_orders'))).length === 1, 'get_orders does not list the order');
    }
  },
  {
    from: '5.1',
    name: 'the order tools come and go with the session, without a reload',
    async run(ctx) {
      const { page } = ctx;
      const orderTools = async () => (await toolNames(page)).filter((n) => ['get_delivery_slots', 'get_orders', 'place_order'].includes(n)).join();
      await fresh(ctx);
      expect((await orderTools()) === '', `signed out, but these are registered: ${await orderTools()}`);
      const changes = page.evaluate(() => new Promise<void>((done) => document.modelContext.addEventListener('toolchange', () => done(), { once: true })));
      await signIn(ctx);
      await changes;
      await until(page, async () => (await document.modelContext.getTools()).some((t) => t.name === 'place_order'), 'place_order to be registered after sign-in');
      expect((await orderTools()) === 'get_delivery_slots,get_orders,place_order', `signed in: ${await orderTools()}`);
      await click(page, '[data-action="sign-out"]');
      await until(page, async () => !(await document.modelContext.getTools()).some((t) => t.name === 'place_order'), 'place_order to be unregistered after sign-out');
      await signIn(ctx);
      await until(page, async () => (await document.modelContext.getTools()).some((t) => t.name === 'place_order'), 'place_order to come back');
      // A reload while signed in registers them from the start.
      await page.reload();
      await until(page, async () => 'modelContext' in document && (await document.modelContext.getTools()).some((t) => t.name === 'place_order'), 'place_order after a reload');
    }
  },
  {
    from: '6.1',
    name: 'every call is logged in the page and reaches the server',
    async run(ctx) {
      const { page } = ctx;
      await fresh(ctx);
      await page.evaluate(() => fetch('/api/agent-log').then((r) => r.json()));
      text(await call(page, 'search_products', { query: 'keyboard' }));
      text(await call(page, 'add_to_cart', { productId: 'hp-999', colour: 'black' }));
      await new Promise((r) => setTimeout(r, 300));
      const log = (await page.evaluate(() => fetch('/api/agent-log').then((r) => r.json()))) as { tool: string; outcome: string; ms: number; input: unknown }[];
      const [latest, before] = log;
      expect(latest?.tool === 'add_to_cart' && latest.outcome === 'error', `the newest log line is ${JSON.stringify(latest)}`);
      expect(before?.tool === 'search_products' && before.outcome === 'ok' && typeof before.ms === 'number', `the line before is ${JSON.stringify(before)}`);
      expect(JSON.stringify(before.input) === '{"query":"keyboard"}', 'the input was not logged');
    }
  }
];

/** Only on the finished app: the drawer and both replays. */
async function drawerChecks({ page, base }: Ctx, log: (ok: boolean, name: string, detail?: string) => void) {
  const attempt = async (name: string, run: () => Promise<void>) => {
    try {
      await run();
      log(true, name);
    } catch (error) {
      log(false, name, (error as Error).message);
    }
  };
  const openTab = async (label: string) => {
    await page.evaluate((l) => [...document.querySelectorAll<HTMLElement>('.ws-tabs button')].find((b) => b.textContent!.startsWith(l))!.click(), label);
  };
  const result = (key: string) => page.evaluate((k) => document.querySelector(`[data-result="${k}"]`)?.textContent ?? '', key);

  await page.goto(`${base}/?drawer=on`);
  await page.evaluate(() => {
    localStorage.setItem('workshop:open', 'true');
    localStorage.setItem('workshop:fast', 'true');
    localStorage.removeItem('workshop:replays');
  });
  await page.reload();
  await page.waitForSelector('.ws-drawer');

  await attempt('drawer: the Guide tab shows a README', async () => {
    await openTab('Guide');
    await until(page, () => (document.querySelector('.ws-markdown')?.textContent?.length ?? 0) > 100, 'the guide to render');
  });
  await attempt('drawer: the Tools tab lists the tools and runs one', async () => {
    await openTab('Tools');
    await until(page, () => document.querySelectorAll('.ws-tool').length >= 5, 'the tool list');
    await page.evaluate(() => {
      const card = [...document.querySelectorAll('.ws-tool')].find((c) => c.querySelector('.ws-tool-name')!.textContent === 'view_cart')!;
      card.querySelector('summary')!.click();
      [...card.querySelectorAll('button')].find((b) => b.textContent === 'Run tool')!.click();
    });
    await until(page, () => document.querySelector('.ws-output')?.textContent?.includes('cart is empty'), 'view_cart’s output');
  });
  await attempt('drawer: “Shop by clicking” finishes the task through the UI', async () => {
    await openTab('Agent view');
    await click(page, '[data-action="replay-clicking"]');
    await until(page, () => /NB-\d+|Stopped/.test(document.querySelector('[data-result="clicking-outcome"]')?.textContent ?? ''), 'the clicking replay to end');
    const outcome = await result('clicking-outcome');
    expect(/NB-\d+/.test(outcome), outcome);
    expect(Number(await result('clicking-steps')) >= 15, `only ${await result('clicking-steps')} steps`);
  });
  await attempt('drawer: “Shop with tools” finishes the task, with the shopper confirming', async () => {
    await click(page, '[data-action="replay-tools"]');
    await page.waitForSelector('dialog.confirm-dialog[open]', { timeout: 15_000 });
    await click(page, '[data-action="confirm-accept"]');
    await until(page, () => /NB-\d+|Stopped/.test(document.querySelector('[data-result="tools-outcome"]')?.textContent ?? ''), 'the tools replay to end');
    const outcome = await result('tools-outcome');
    expect(/NB-\d+/.test(outcome), outcome);
    expect(Number(await result('tools-steps')) === 6, `${await result('tools-steps')} steps, expected 6`);
  });
  await attempt('drawer: the Activity tab shows the logged calls', async () => {
    await openTab('Activity');
    await until(page, () => document.querySelectorAll('.ws-call').length >= 5, 'the logged calls');
  });
}

/** The shop in a Chrome without the flag: no modelContext, and nothing breaks. */
async function withoutWebMCP(chrome: string, base: string, log: (ok: boolean, name: string, detail?: string) => void) {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: !headed, args: ['--disable-features=WebMCP'] });
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push((e as Error).message));
    await page.goto(`${base}/?drawer=on`);
    await page.evaluate(() => localStorage.setItem('workshop:open', 'true'));
    await page.reload();
    await page.waitForSelector('.ws-drawer');
    const has = await page.evaluate(() => 'modelContext' in document);
    expect(!has, 'this Chrome has document.modelContext even without the flag, so the fallback could not be checked');
    await until(page, () => document.querySelector('.ws-status')?.textContent === 'WebMCP off', 'the drawer to say WebMCP is off');
    await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.ws-tabs button')].find((b) => b.textContent!.startsWith('Agent'))!.click());
    await page.evaluate(() => localStorage.setItem('workshop:fast', 'true'));
    await click(page, '.ws-check input');
    await click(page, '[data-action="replay-clicking"]');
    await until(page, () => /NB-\d+|Stopped/.test(document.querySelector('[data-result="clicking-outcome"]')?.textContent ?? ''), 'the clicking replay to end');
    const outcome = await page.evaluate(() => document.querySelector('[data-result="clicking-outcome"]')!.textContent!);
    expect(/NB-\d+/.test(outcome), outcome);
    expect(!errors.length, `page errors: ${errors.join(' | ')}`);
    log(true, 'without the flag: the shop works, the drawer says WebMCP is off, and the UI replay finishes');
  } catch (error) {
    log(false, 'without the flag: the shop works and says WebMCP is off', (error as Error).message);
  } finally {
    await browser.close();
  }
}

// --------------------------------------------------------------------- run

const chrome = findChrome();
const browser: Browser = await puppeteer.launch({ executablePath: chrome, headless: !headed, args: [FEATURES] });
const version = await browser.version();
const major = Number(/(\d+)\./.exec(version)?.[1]);
const results: { folder: string; name: string; ok: boolean; detail?: string }[] = [];
if (!json) console.log(`${version}\n${chrome}\n`);
if (major < 155) {
  console.error(`This is Chrome ${major}. The workshop needs 155 or later.`);
  await browser.close();
  process.exit(1);
}

const targets = [
  ...STEPS.filter((s) => !only || s.id === only).map((s) => ({ id: s.id, dir: relative(ROOT, s.dir('solution')) })),
  ...(only && only !== 'app' ? [] : [{ id: '99.99', dir: 'app' }])
];

let port = 5180;
for (const target of targets) {
  port++;
  const base = `http://localhost:${port}`;
  const server = await serve(target.dir, port);
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push((e as Error).message));
  const log = (ok: boolean, name: string, detail?: string) => {
    results.push({ folder: target.dir, name, ok, detail });
    if (!json) console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? `\n      ${detail}` : ''}`);
  };
  if (!json) console.log(target.dir);
  try {
    await page.goto(`${base}/?drawer=off`);
    const supported = await page.evaluate(() => 'modelContext' in document);
    log(supported, 'document.modelContext exists', supported ? undefined : `Chrome was started with ${FEATURES} and still has no modelContext`);
    if (supported) {
      for (const check of checks.filter((c) => compareIds(target.id, c.from) >= 0)) {
        pageErrors.length = 0;
        try {
          await check.run({ page, base });
          expect(!pageErrors.length, `page errors: ${pageErrors.join(' | ')}`);
          log(true, `${check.from} ${check.name}`);
        } catch (error) {
          log(false, `${check.from} ${check.name}`, (error as Error).message);
        }
      }
      if (target.dir === 'app') await drawerChecks({ page, base }, log);
    }
    if (target.dir === 'app') await withoutWebMCP(chrome, base, log);
  } finally {
    await context.close();
    server.kill();
  }
}
await browser.close();

const failed = results.filter((r) => !r.ok);
if (json) console.log(JSON.stringify({ ok: !failed.length, chrome: version, results }, null, 2));
else console.log(failed.length ? `\n${failed.length} of ${results.length} checks failed.` : `\nAll ${results.length} checks pass in ${version}.`);
process.exit(failed.length ? 1 : 0);
