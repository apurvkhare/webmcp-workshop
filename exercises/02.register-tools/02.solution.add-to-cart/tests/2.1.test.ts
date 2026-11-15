import { beforeEach, describe, expect, it } from 'vitest';
import { createTestShop, installModelContext, removeModelContext, settle, type FakeModelContext, type TestShop } from '@shop/testing';
import { setupWebMCP } from '../webmcp/index.ts';

let shop: TestShop;
let agent: FakeModelContext;

beforeEach(async () => {
  agent = installModelContext();
  shop = await createTestShop();
  setupWebMCP(shop);
  await settle();
});

describe('2.1 search_products', () => {
  it('is registered, with a description an agent can work from', () => {
    const tool = agent.tool('search_products');
    expect(tool, 'No tool named search_products is registered').toBeDefined();
    expect(tool!.description.length, 'The description is the agent’s only guide: say what comes back').toBeGreaterThanOrEqual(40);
    expect(tool!.description.length, 'Keep the description under 500 characters').toBeLessThanOrEqual(500);
  });

  it('describes its input with JSON Schema', () => {
    const schema = agent.tool('search_products')?.inputSchema;
    expect(schema?.type).toBe('object');
    const properties = schema?.properties ?? {};
    expect(Object.keys(properties)).toEqual(expect.arrayContaining(['query', 'category', 'maxPrice', 'minRating']));
    expect(properties.query?.type).toBe('string');
    expect(properties.maxPrice?.type).toBe('number');
    expect(properties.minRating?.type).toBe('number');
    expect(properties.category?.enum, 'category lists the shop’s categories with enum').toEqual([...shop.categories]);
    for (const [name, property] of Object.entries(properties)) {
      expect(property.description, `${name} needs a description`).toBeTruthy();
    }
    expect(schema?.required ?? [], 'Every filter is optional').toEqual([]);
  });

  it('answers with the matching products, as JSON text', async () => {
    const text = await agent.call('search_products', { query: 'wireless headphones', maxPrice: 5000, minRating: 4 });
    const products = JSON.parse(text) as { id: string; name: string; price: number; rating: number; colours: string[] }[];
    expect(products.map((p) => p.id).sort()).toEqual(['hp-101', 'hp-102', 'hp-103', 'hp-107']);
    for (const product of products) {
      expect(product).toMatchObject({ name: expect.any(String), price: expect.any(Number), rating: expect.any(Number), colours: expect.any(Array) });
    }
  });

  it('keeps a broad search small enough for an agent', async () => {
    const text = await agent.call('search_products', {});
    expect((JSON.parse(text) as unknown[]).length).toBeLessThanOrEqual(8);
    expect(text.length, 'Chrome suggests at most 1,500 characters per tool result').toBeLessThanOrEqual(1500);
  });

  it('leaves the shop alone in a browser without WebMCP', () => {
    removeModelContext();
    expect(() => setupWebMCP(shop)).not.toThrow();
  });
});
