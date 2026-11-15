import { beforeEach, describe, expect, it } from 'vitest';
import { createTestShop, installModelContext, settle, type FakeModelContext, type TestShop } from '@shop/testing';
import { setupWebMCP } from '../webmcp/index.ts';

let shop: TestShop;
let agent: FakeModelContext;
let slotId: string;

beforeEach(async () => {
  agent = installModelContext();
  shop = await createTestShop();
  setupWebMCP(shop);
  await shop.signIn();
  await shop.addToCart({ productId: 'hp-102', colour: 'black', quantity: 1 });
  slotId = (await shop.getDeliverySlots())[0]!.id;
  await settle();
});

const orders = () => shop.service().getOrders();

describe('4.2 place_order', () => {
  it('is marked consequential, and not read-only', () => {
    const annotations = agent.tool('place_order')?.annotations ?? {};
    expect(annotations.consequentialHint).toBe(true);
    expect(annotations.readOnlyHint ?? false).toBe(false);
  });

  it('asks the shopper, and orders nothing when they say no', async () => {
    shop.answerConfirm(false);
    const text = await agent.call('place_order', { slotId });
    expect(shop.confirmations, 'shop.ui.confirm() was not called').toHaveLength(1);
    expect(orders()).toHaveLength(0);
    expect(shop.service().getCart().itemCount, 'The cart is untouched').toBe(1);
    expect(text).not.toMatch(/NB-\d+/);
    expect(text, 'Tell the agent that nothing was ordered').toMatch(/not|nothing|declin/i);
  });

  it('shows the shopper what they are agreeing to', async () => {
    await agent.call('place_order', { slotId });
    const { title, lines, confirmLabel } = shop.confirmations[0]!;
    const shown = [title, ...lines, confirmLabel ?? ''].join('\n');
    expect(shown).toContain('Tarang Studio Pro');
    expect(shown, 'the total').toContain('₹4,799');
    expect(shown, 'where it is going').toContain('560038');
  });

  it('orders when the shopper says yes', async () => {
    shop.answerConfirm(true);
    const text = await agent.call('place_order', { slotId });
    expect(text).toContain('NB-1001');
    expect(orders()).toHaveLength(1);
    expect(shop.service().getCart().itemCount).toBe(0);
  });

  it('closes the dialog when the call is cancelled', async () => {
    shop.answerConfirm('wait');
    const cancel = new AbortController();
    const call = agent.call('place_order', { slotId }, { signal: cancel.signal });
    await settle();
    expect(shop.getState().confirm, 'The dialog is open while the shopper decides').not.toBeNull();
    cancel.abort();
    await expect(call).rejects.toThrow();
    await settle();
    expect(shop.getState().confirm, 'Pass execute’s signal to shop.ui.confirm()').toBeNull();
    expect(orders()).toHaveLength(0);
  });

  it('does not ask when there is nothing to order', async () => {
    await shop.setQuantity({ productId: 'hp-102', colour: 'black', quantity: 0 });
    const text = await agent.call('place_order', { slotId });
    expect(text).toMatch(/^Error:/);
    expect(shop.confirmations).toHaveLength(0);
  });
});
