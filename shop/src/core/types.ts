/** The shop's data shapes. Shared by the API server, the browser and the tests. */

export const CATEGORIES = ['headphones', 'earbuds', 'speakers', 'keyboards', 'mice', 'chargers', 'smartwatches'] as const;
export type Category = (typeof CATEGORIES)[number];

export const SORT_ORDERS = ['relevance', 'price-low', 'price-high', 'rating'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export interface Product {
  /** For example "hp-102". */
  id: string;
  name: string;
  brand: string;
  category: Category;
  /** In whole rupees. */
  price: number;
  mrp: number;
  /** Average of all ratings, 1 to 5, one decimal. */
  rating: number;
  ratingCount: number;
  /** Lowercase colour names. A cart line always names one of them. */
  colours: string[];
  inStock: boolean;
  blurb: string;
  features: string[];
  tags: string[];
}

export interface SearchFilters {
  query?: string;
  category?: Category;
  maxPrice?: number;
  minRating?: number;
  sort?: SortOrder;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  /** ISO date. */
  date: string;
}

export interface CartLine {
  productId: string;
  name: string;
  colour: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Coupon {
  code: string;
  description: string;
}

export interface Cart {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  coupon: Coupon | null;
  discount: number;
  deliveryFee: number;
  total: number;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  pincode: string;
  addressType: 'home' | 'work';
}

export interface DeliverySlot {
  /** For example "2026-11-16-am". */
  id: string;
  /** For example "Tomorrow, 16 Nov, 9 am to 12 pm". */
  label: string;
}

export interface OrderPreview {
  cart: Cart;
  address: Address;
  slot: DeliverySlot;
  total: number;
}

export interface Order {
  /** For example "NB-1001". */
  id: string;
  placedAt: string;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  coupon: string | null;
  address: Address;
  slot: DeliverySlot;
  payment: 'Pay on delivery';
  status: 'Confirmed';
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export type ShopErrorCode =
  | 'PRODUCT_NOT_FOUND'
  | 'COLOUR_UNAVAILABLE'
  | 'OUT_OF_STOCK'
  | 'BAD_QUANTITY'
  | 'COUPON_INVALID'
  | 'NOT_SIGNED_IN'
  | 'CART_EMPTY'
  | 'ADDRESS_MISSING'
  | 'ADDRESS_INVALID'
  | 'SLOT_NOT_FOUND'
  | 'ORDER_NOT_FOUND'
  | 'BAD_REQUEST';

/** A problem the shopper (or an agent) can do something about. `message` is written to be shown as it is. */
export class ShopError extends Error {
  readonly code: ShopErrorCode;
  constructor(code: ShopErrorCode, message: string) {
    super(message);
    this.name = 'ShopError';
    this.code = code;
  }
}

/** "₹4,799" */
export const formatINR = (rupees: number) => `₹${Math.round(rupees).toLocaleString('en-IN')}`;
