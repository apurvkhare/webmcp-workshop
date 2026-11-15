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

const itemsInCart = () => shop.service().getCart().itemCount;

describe('2.2 add_to_cart', () => {
  it('says which fields are required', () => {
    const required = agent.tool('add_to_cart')?.inputSchema?.required ?? [];
    expect(required).toEqual(expect.arrayContaining(['productId', 'colour']));
    expect(required, 'quantity has a default, so it is not required').not.toContain('quantity');
  });

  it('adds a product in a colour it comes in', async () => {
    const text = await agent.call('add_to_cart', { productId: 'hp-102', colour: 'black' });
    expect(text).not.toMatch(/^Error/);
    expect(text).toContain('Tarang Studio Pro');
    expect(itemsInCart()).toBe(1);
  });

  it('adds the quantity it was asked for', async () => {
    await agent.call('add_to_cart', { productId: 'ch-604', colour: 'red', quantity: 3 });
    expect(itemsInCart()).toBe(3);
  });

  it('answers an unknown product id by pointing at search_products', async () => {
    const text = await agent.call('add_to_cart', { productId: 'hp-999', colour: 'black' });
    expect(text).toMatch(/^Error:/);
    expect(text).toContain('search_products');
    expect(itemsInCart()).toBe(0);
  });

  it('answers a wrong colour with the colours the product comes in', async () => {
    const text = await agent.call('add_to_cart', { productId: 'hp-103', colour: 'black' });
    expect(text).toMatch(/^Error:/);
    expect(text).toContain('blue');
    expect(text).toContain('red');
    expect(itemsInCart()).toBe(0);
  });

  it.each([0, 9, 1.5, 'two'])('refuses quantity %j', async (quantity) => {
    const text = await agent.call('add_to_cart', { productId: 'hp-102', colour: 'black', quantity });
    expect(text).toMatch(/^Error:/);
    expect(itemsInCart()).toBe(0);
  });

  it('returns what the shop refuses, instead of throwing', async () => {
    const text = await agent.call('add_to_cart', { productId: 'sp-304', colour: 'green' });
    expect(text).toMatch(/^Error:.*out of stock/);
  });

  it('never throws, whatever the agent sends', async () => {
    await expect(agent.call('add_to_cart', {})).resolves.toMatch(/^Error:/);
    await expect(agent.call('add_to_cart', { productId: 42, colour: null })).resolves.toMatch(/^Error:/);
  });
});
