/**
 * What step code imports from '@shop': the shop object's type, the data shapes, and a few helpers.
 * Nothing in here is WebMCP. It is the app you are making agent-ready.
 */
import { ShopError, type Address } from './core/types.ts';

export { CATEGORIES, SORT_ORDERS, ShopError, formatINR } from './core/types.ts';
export type { Address, Cart, CartLine, Category, Coupon, DeliverySlot, Order, OrderPreview, Product, Review, SearchFilters, SortOrder, User } from './core/types.ts';
export type { CartItem } from './core/backend.ts';
export type { AgentLog, AgentLogEntry, ConfirmRequest, Outcome, Shop, ShopUI } from './client/shop.ts';

/**
 * Turns a problem the shop reported into text an agent can act on: "Error: …".
 * Anything that isn't a ShopError is a bug, so it is thrown again.
 */
export function errorText(error: unknown): string {
  if (error instanceof ShopError) return `Error: ${error.message}`;
  throw error;
}

/** Reads the address form's fields. The server checks them when the address is saved. */
export function readAddress(form: HTMLFormElement): Address {
  const data = new FormData(form);
  const field = (name: string) => String(data.get(name) ?? '').trim();
  return {
    fullName: field('fullName'),
    phone: field('phone'),
    line1: field('line1'),
    city: field('city'),
    pincode: field('pincode'),
    addressType: field('addressType') === 'work' ? 'work' : 'home'
  };
}
