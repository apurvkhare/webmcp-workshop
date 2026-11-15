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

const ORDER_TOOLS = ['get_delivery_slots', 'get_orders', 'place_order'];
const orderTools = () => agent.names().filter((name) => ORDER_TOOLS.includes(name));

describe('5.1 tools follow state', () => {
  it('has no order tools while nobody is signed in', () => {
    expect(orderTools()).toEqual([]);
    expect(agent.names()).toEqual(expect.arrayContaining(['search_products', 'add_to_cart']));
  });

  it('registers them when someone signs in', async () => {
    await shop.signIn();
    await settle();
    expect(orderTools()).toEqual(ORDER_TOOLS);
  });

  it('takes them away on sign-out', async () => {
    await shop.signIn();
    await settle();
    await shop.signOut();
    await settle();
    expect(orderTools()).toEqual([]);
    expect(agent.names(), 'The other tools stay').toEqual(expect.arrayContaining(['search_products', 'add_to_cart']));
  });

  it('brings them back on the next sign-in, once each', async () => {
    for (let i = 0; i < 2; i++) {
      await shop.signIn();
      await settle();
      await shop.signOut();
      await settle();
    }
    await shop.signIn();
    await settle();
    expect(orderTools()).toEqual(ORDER_TOOLS);
  });

  it('registers them straight away when the page loads signed in', async () => {
    agent = installModelContext();
    shop = await createTestShop();
    await shop.signIn();
    setupWebMCP(shop);
    await settle();
    expect(orderTools()).toEqual(ORDER_TOOLS);
  });

  it('tells listeners with toolchange', async () => {
    const before = agent.events.filter((e) => e === 'toolchange').length;
    await shop.signIn();
    await settle();
    expect(agent.events.filter((e) => e === 'toolchange').length).toBeGreaterThan(before);
  });
});
