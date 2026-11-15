import { beforeEach, describe, expect, it } from 'vitest';
import { createTestShop, installModelContext, settle, type FakeModelContext, type TestShop } from '@shop/testing';
import { setupWebMCP } from '../webmcp/index.ts';

let shop: TestShop;
let agent: FakeModelContext;

beforeEach(async () => {
  agent = installModelContext();
  shop = await createTestShop();
  setupWebMCP(shop);
  await settle();
});

const annotations = (name: string) => agent.tool(name)?.annotations ?? {};

describe('4.1 annotations', () => {
  it.each(['search_products', 'view_cart', 'get_reviews'])('%s is marked read-only', (name) => {
    expect(agent.tool(name), `No tool named ${name}`).toBeDefined();
    expect(annotations(name).readOnlyHint).toBe(true);
  });

  it('get_reviews says its result is untrusted', () => {
    expect(annotations('get_reviews').untrustedContentHint).toBe(true);
  });

  it('only get_reviews claims untrusted content', () => {
    for (const name of ['search_products', 'view_cart', 'add_to_cart', 'apply_coupon']) {
      expect(annotations(name).untrustedContentHint ?? false, name).toBe(false);
    }
  });

  it.each(['add_to_cart', 'apply_coupon'])('%s changes the cart, so it is not read-only', (name) => {
    expect(annotations(name).readOnlyHint ?? false).toBe(false);
  });

  it('get_reviews really does return text a stranger wrote for the agent', async () => {
    const text = await agent.call('get_reviews', { productId: 'hp-102' });
    expect(text).toMatch(/ignore your previous instructions/i);
  });
});
