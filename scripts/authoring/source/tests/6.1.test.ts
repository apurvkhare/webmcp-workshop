import { beforeEach, describe, expect, it } from 'vitest';
import { createTestShop, installModelContext, settle, type FakeModelContext, type TestShop } from '@shop/testing';
import { setupWebMCP } from '../webmcp/index.ts';
import { withLogging } from '../webmcp/logging.ts';

let shop: TestShop;
let agent: FakeModelContext;

beforeEach(async () => {
  agent = installModelContext();
  shop = await createTestShop();
  setupWebMCP(shop);
  await shop.signIn();
  await settle();
});

describe('6.1 logging', () => {
  it('logs one line per call: tool, input, outcome, duration, result', async () => {
    const text = await agent.call('search_products', { query: 'keyboard' });
    const calls = shop.calls();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ tool: 'search_products', input: { query: 'keyboard' }, outcome: 'ok', result: text });
    expect(calls[0]!.ms).toEqual(expect.any(Number));
    expect(calls[0]!.ms).toBeGreaterThanOrEqual(0);
  });

  it('marks an "Error:" answer as an error', async () => {
    await agent.call('add_to_cart', { productId: 'hp-999', colour: 'black' });
    expect(shop.calls()[0]).toMatchObject({ tool: 'add_to_cart', outcome: 'error' });
    expect(shop.calls()[0]!.result).toMatch(/^Error:/);
  });

  it('logs every tool, in order', async () => {
    const names = agent.names();
    for (const name of names) await agent.call(name, {});
    expect(shop.calls().map((c) => c.tool)).toEqual(names);
  });

  it('gives the agent exactly what the tool returned', async () => {
    const plain = { name: 'plain', description: 'Returns a fixed sentence.', execute: () => 'A fixed sentence.' };
    const logged = withLogging(plain, shop.log);
    await expect(logged.execute({}, { signal: new AbortController().signal })).resolves.toBe('A fixed sentence.');
  });

  it('logs a throw, and still throws', async () => {
    const broken = withLogging(
      {
        name: 'broken',
        description: 'Always throws.',
        execute: () => {
          throw new Error('kaboom');
        }
      },
      shop.log
    );
    await expect(Promise.resolve().then(() => broken.execute({ a: 1 }, { signal: new AbortController().signal }))).rejects.toThrow('kaboom');
    expect(shop.calls()[0]).toMatchObject({ tool: 'broken', input: { a: 1 }, outcome: 'threw' });
    expect(shop.calls()[0]!.result).toContain('kaboom');
  });

  it('leaves the rest of the tool as it was', () => {
    const tool = agent.tool('search_products')!;
    expect(tool.description).toBeTruthy();
    expect(tool.inputSchema?.properties?.query).toBeTruthy();
    expect(tool.annotations?.readOnlyHint).toBe(true);
  });
});
