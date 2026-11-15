/**
 * The ShopBackend the browser uses: plain fetch calls to /api on the same origin.
 * 🧠 No tokens anywhere. The session cookie the shopper already has goes along with every request,
 * whether a click or a WebMCP tool made it.
 */
import type { ShopBackend } from '../core/backend.ts';
import { ShopError, type SearchFilters, type ShopErrorCode } from '../core/types.ts';

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (response.status === 204) return undefined as T;
  const data = (await response.json().catch(() => null)) as { error?: { code: ShopErrorCode; message: string } } | null;
  if (!response.ok) {
    if (data?.error) throw new ShopError(data.error.code, data.error.message);
    throw new Error(`${method} /api${path} failed with ${response.status}`);
  }
  return data as T;
}

const query = (filters: SearchFilters) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.set(key, String(value));
  const text = params.toString();
  return text ? `?${text}` : '';
};

const id = encodeURIComponent;

export function httpBackend(): ShopBackend {
  return {
    searchProducts: (filters) => call('GET', `/products${query(filters)}`),
    getProduct: (productId) =>
      call<never>('GET', `/products/${id(productId)}`).catch((error) => {
        if (error instanceof ShopError && error.code === 'PRODUCT_NOT_FOUND') return null;
        throw error;
      }),
    getReviews: (productId) => call('GET', `/products/${id(productId)}/reviews`),
    getCart: () => call('GET', '/cart'),
    addToCart: (item) => call('POST', '/cart/items', item),
    setQuantity: (item) => call('PATCH', '/cart/items', item),
    applyCoupon: (code) => call('POST', '/cart/coupon', { code }),
    removeCoupon: () => call('DELETE', '/cart/coupon'),
    getUser: () => call<{ user: never }>('GET', '/session').then((r) => r.user),
    signIn: () => call<{ user: never }>('POST', '/session').then((r) => r.user),
    signOut: () => call('DELETE', '/session'),
    getAddress: () => call('GET', '/address'),
    saveAddress: (address) => call('PUT', '/address', address),
    getDeliverySlots: () => call('GET', '/delivery-slots'),
    previewOrder: (slotId) => call('POST', '/orders/preview', { slotId }),
    placeOrder: (slotId) => call('POST', '/orders', { slotId }),
    getOrders: () => call('GET', '/orders'),
    getOrder: (orderId) => call('GET', `/orders/${id(orderId)}`),
    reset: () => call('POST', '/dev/reset')
  };
}
