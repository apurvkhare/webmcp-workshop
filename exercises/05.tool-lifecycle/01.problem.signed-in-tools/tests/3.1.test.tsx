import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Address } from '@shop';
import { createTestShop, type TestShop } from '@shop/testing';
import { AddressForm } from '../ui/AddressForm.tsx';

let shop: TestShop;
let root: Root;
let form: HTMLFormElement;
let saved: Address[];

beforeEach(async () => {
  shop = await createTestShop();
  await shop.signIn();
  saved = [];
  const host = document.body.appendChild(document.createElement('div'));
  root = createRoot(host);
  const address = await shop.getAddress();
  await act(async () => root.render(<AddressForm shop={shop} address={address} onSaved={(a) => saved.push(a)} />));
  form = host.querySelector('form')!;
});

afterEach(async () => {
  await act(async () => root.unmount());
  document.body.replaceChildren();
});

const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;

/** Submits the form the way Chrome does: for an agent, the submit event has agentInvoked and respondWith(). */
async function submit(agentInvoked: boolean) {
  const respondWith = vi.fn<(response: Promise<unknown>) => void>();
  const event = Object.assign(new Event('submit', { bubbles: true, cancelable: true }), { agentInvoked, respondWith });
  await act(async () => void form.dispatchEvent(event));
  return { event, respondWith };
}

describe('3.1 the address form as a tool', () => {
  it('has a toolname and a tooldescription', () => {
    expect(form.getAttribute('toolname')).toBe('set_delivery_address');
    expect(form.getAttribute('tooldescription')?.length ?? 0, 'Describe what the form does, for the agent').toBeGreaterThanOrEqual(30);
  });

  it('describes the fields whose label does not say enough', () => {
    expect(field('phone').getAttribute('toolparamdescription') ?? '').toMatch(/10/);
    expect(field('pincode').getAttribute('toolparamdescription') ?? '').toMatch(/6/);
  });

  it('keeps a name on every field and a submit button', () => {
    for (const name of ['fullName', 'phone', 'line1', 'city', 'pincode', 'addressType']) expect(field(name), `a field named ${name}`).toBeTruthy();
    expect(form.querySelector('button[type="submit"]'), 'Without toolautosubmit, Chrome needs a submit button to hand over to the shopper').toBeTruthy();
  });

  it('answers the agent with what happened', async () => {
    field('line1').value = '221, 12th Main, Koramangala';
    field('pincode').value = '560034';
    const { event, respondWith } = await submit(true);
    expect(event.defaultPrevented, 'preventDefault() comes first').toBe(true);
    expect(respondWith).toHaveBeenCalledTimes(1);
    const answer = await respondWith.mock.calls[0]![0];
    expect(answer).toMatch(/Saved the delivery address/);
    expect(answer).toContain('560034');
    expect(saved).toHaveLength(1);
    expect(shop.service().getAddress()?.pincode).toBe('560034');
  });

  it('tells the agent when the shop refuses the address', async () => {
    field('pincode').value = '12';
    const { respondWith } = await submit(true);
    await expect(respondWith.mock.calls[0]![0]).resolves.toMatch(/^Error:.*PIN/i);
    expect(saved).toHaveLength(0);
  });

  it('does not call respondWith when a person submits', async () => {
    const { respondWith } = await submit(false);
    await act(async () => {});
    expect(respondWith).not.toHaveBeenCalled();
    expect(saved).toHaveLength(1);
  });
});
