/**
 * Everything the browser asks the shop's server for. The real one speaks HTTP (client/http-backend.ts);
 * the tests wrap a ShopService directly, so step code runs the same rules in both places.
 */
import type { ShopService } from './service.ts';
import type { Address, Cart, DeliverySlot, Order, OrderPreview, Product, Review, SearchFilters, User } from './types.ts';

export interface CartItem {
  productId: string;
  colour: string;
  quantity: number;
}

export interface ShopBackend {
  searchProducts(filters: SearchFilters): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  getReviews(productId: string): Promise<Review[]>;
  getCart(): Promise<Cart>;
  addToCart(item: CartItem): Promise<Cart>;
  setQuantity(item: CartItem): Promise<Cart>;
  applyCoupon(code: string): Promise<Cart>;
  removeCoupon(): Promise<Cart>;
  getUser(): Promise<User | null>;
  signIn(): Promise<User>;
  signOut(): Promise<void>;
  getAddress(): Promise<Address | null>;
  saveAddress(address: Address): Promise<Address>;
  getDeliverySlots(): Promise<DeliverySlot[]>;
  previewOrder(slotId: string): Promise<OrderPreview>;
  placeOrder(slotId: string): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order>;
  /** Back to a signed-out shopper with an empty cart and no orders. */
  reset(): Promise<void>;
}

/** A backend with no network: every call goes straight to one ShopService. */
export function localBackend(create: () => ShopService): ShopBackend & { service: () => ShopService } {
  let service = create();
  const run = <T>(fn: (s: ShopService) => T): Promise<T> => {
    try {
      // Copy on the way out, the way JSON over HTTP would.
      return Promise.resolve(structuredClone(fn(service)));
    } catch (error) {
      return Promise.reject(error);
    }
  };
  return {
    service: () => service,
    searchProducts: (filters) => run((s) => s.searchProducts(filters)),
    getProduct: (id) => run((s) => s.getProduct(id)),
    getReviews: (id) => run((s) => s.getReviews(id)),
    getCart: () => run((s) => s.getCart()),
    addToCart: (item) => run((s) => s.addToCart(item)),
    setQuantity: (item) => run((s) => s.setQuantity(item)),
    applyCoupon: (code) => run((s) => s.applyCoupon(code)),
    removeCoupon: () => run((s) => s.removeCoupon()),
    getUser: () => run((s) => s.getUser()),
    signIn: () => run((s) => s.signIn()),
    signOut: () => run((s) => s.signOut()),
    getAddress: () => run((s) => s.getAddress()),
    saveAddress: (address) => run((s) => s.saveAddress(address)),
    getDeliverySlots: () => run((s) => s.getDeliverySlots()),
    previewOrder: (slotId) => run((s) => s.previewOrder(slotId)),
    placeOrder: (slotId) => run((s) => s.placeOrder(slotId)),
    getOrders: () => run((s) => s.getOrders()),
    getOrder: (id) => run((s) => s.getOrder(id)),
    reset: () => {
      service = create();
      return Promise.resolve();
    }
  };
}
