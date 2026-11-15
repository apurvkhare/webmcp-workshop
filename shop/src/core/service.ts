/**
 * The shop's rules, in memory: search, the cart, coupons, the demo shopper, addresses, slots and orders.
 * The API server keeps one ShopService per browser session. The tests use one directly.
 */
import { COUPONS, DELIVERY_FEE, DEMO_ADDRESS, DEMO_USER, FREE_DELIVERY_FROM, MAX_PER_LINE, PRODUCTS, REVIEWS, type CouponRule } from './catalog.ts';
import {
  CATEGORIES,
  SORT_ORDERS,
  ShopError,
  type Address,
  type Cart,
  type CartLine,
  type DeliverySlot,
  type Order,
  type OrderPreview,
  type Product,
  type Review,
  type SearchFilters,
  type User
} from './types.ts';

const STOP_WORDS = new Set(['a', 'an', 'and', 'the', 'for', 'with', 'in', 'of', 'under', 'below', 'best']);
/** "headphones" and "headphone" should match each other. */
const stem = (word: string) => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word);
const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .filter(Boolean)
    .map(stem);

const haystacks = new Map(
  PRODUCTS.map((p) => [p.id, { name: words(`${p.name} ${p.brand}`), rest: words(`${p.category} ${p.tags.join(' ')} ${p.blurb}`) }])
);

export function searchCatalog(filters: SearchFilters): Product[] {
  const terms = words(filters.query ?? '').filter((w) => !STOP_WORDS.has(w));
  const scored = PRODUCTS.flatMap((product) => {
    if (filters.category && product.category !== filters.category) return [];
    if (typeof filters.maxPrice === 'number' && product.price > filters.maxPrice) return [];
    if (typeof filters.minRating === 'number' && product.rating < filters.minRating) return [];
    const hay = haystacks.get(product.id)!;
    let score = 0;
    for (const term of terms) {
      if (hay.name.includes(term)) score += 3;
      else if (hay.rest.includes(term)) score += 1;
      else return [];
    }
    return [{ product, score }];
  });
  const sort = filters.sort ?? 'relevance';
  scored.sort((a, b) => {
    if (sort === 'price-low') return a.product.price - b.product.price;
    if (sort === 'price-high') return b.product.price - a.product.price;
    if (sort === 'rating') return b.product.rating - a.product.rating;
    return b.score - a.score || b.product.rating - a.product.rating;
  });
  return scored.map((s) => s.product);
}

/** Turns loose input (a query string, a tool call) into filters, dropping anything that isn't valid. */
export function parseFilters(input: Record<string, unknown>): SearchFilters {
  const filters: SearchFilters = {};
  const number = (value: unknown) => (value === '' || value === null || value === undefined ? NaN : Number(value));
  if (typeof input.query === 'string' && input.query.trim()) filters.query = input.query.trim();
  if (CATEGORIES.includes(input.category as never)) filters.category = input.category as SearchFilters['category'];
  if (Number.isFinite(number(input.maxPrice))) filters.maxPrice = number(input.maxPrice);
  if (Number.isFinite(number(input.minRating))) filters.minRating = number(input.minRating);
  if (SORT_ORDERS.includes(input.sort as never)) filters.sort = input.sort as SearchFilters['sort'];
  return filters;
}

const DAY = 24 * 60 * 60 * 1000;
const WINDOWS = [
  { key: 'am', label: '9 am to 12 pm' },
  { key: 'pm', label: '4 pm to 8 pm' }
] as const;

export function deliverySlots(now: Date): DeliverySlot[] {
  return [1, 2].flatMap((offset) => {
    const day = new Date(now.getTime() + offset * DAY);
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const date = day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const name = offset === 1 ? 'Tomorrow' : day.toLocaleDateString('en-IN', { weekday: 'long' });
    return WINDOWS.map((w) => ({ id: `${iso}-${w.key}`, label: `${name}, ${date}, ${w.label}` }));
  });
}

export function checkAddress(input: Partial<Record<keyof Address, unknown>>): Address {
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const address: Address = {
    fullName: text(input.fullName),
    phone: text(input.phone).replace(/[\s-]/g, ''),
    line1: text(input.line1),
    city: text(input.city),
    pincode: text(input.pincode),
    addressType: input.addressType === 'work' ? 'work' : 'home'
  };
  const problems: string[] = [];
  if (address.fullName.length < 2) problems.push('fullName is required');
  if (!/^[6-9]\d{9}$/.test(address.phone)) problems.push('phone must be a 10-digit Indian mobile number');
  if (address.line1.length < 5) problems.push('line1 (house, street, area) is required');
  if (address.city.length < 2) problems.push('city is required');
  if (!/^[1-9]\d{5}$/.test(address.pincode)) problems.push('pincode must be a 6-digit PIN code');
  if (problems.length) throw new ShopError('ADDRESS_INVALID', `The address isn't complete: ${problems.join('; ')}.`);
  return address;
}

export class ShopService {
  private lines: { productId: string; colour: string; quantity: number }[] = [];
  private coupon: CouponRule | null = null;
  private signedIn = false;
  private address: Address | null = { ...DEMO_ADDRESS };
  private orders: Order[] = [];
  private nextOrder = 1001;

  constructor(private readonly now: () => Date = () => new Date()) {}

  // ------------------------------------------------------------- catalogue

  searchProducts(filters: SearchFilters): Product[] {
    return searchCatalog(filters);
  }

  getProduct(id: string): Product | null {
    return PRODUCTS.find((p) => p.id === id) ?? null;
  }

  getReviews(productId: string): Review[] {
    this.product(productId);
    return REVIEWS.filter((r) => r.productId === productId);
  }

  private product(id: unknown): Product {
    const product = typeof id === 'string' ? this.getProduct(id) : null;
    if (!product) throw new ShopError('PRODUCT_NOT_FOUND', `No product has the id "${String(id)}".`);
    return product;
  }

  // ------------------------------------------------------------------ cart

  getCart(): Cart {
    const lines: CartLine[] = this.lines.map((line) => {
      const product = this.product(line.productId);
      return { ...line, name: product.name, unitPrice: product.price, lineTotal: product.price * line.quantity };
    });
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    // A coupon that no longer applies (the cart shrank) is dropped, not silently kept.
    if (this.coupon?.refuse?.(subtotal) || subtotal === 0) this.coupon = null;
    const discount = this.coupon ? this.coupon.discount(subtotal) : 0;
    const deliveryFee = subtotal === 0 || subtotal - discount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
    return {
      lines,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal,
      coupon: this.coupon ? { code: this.coupon.code, description: this.coupon.description } : null,
      discount,
      deliveryFee,
      total: subtotal - discount + deliveryFee
    };
  }

  addToCart(item: { productId: string; colour: string; quantity: number }): Cart {
    const existing = this.lines.find((l) => l.productId === item.productId && l.colour === item.colour);
    return this.setQuantity({ ...item, quantity: (existing?.quantity ?? 0) + item.quantity }, item.quantity);
  }

  /** Sets a line's quantity. 0 removes it. */
  setQuantity(item: { productId: string; colour: string; quantity: number }, added = item.quantity): Cart {
    const product = this.product(item.productId);
    if (!product.colours.includes(item.colour)) {
      throw new ShopError('COLOUR_UNAVAILABLE', `${product.name} comes in ${product.colours.join(', ')}, not "${String(item.colour)}".`);
    }
    if (!Number.isInteger(item.quantity) || !Number.isInteger(added) || item.quantity < 0) {
      throw new ShopError('BAD_QUANTITY', 'The quantity must be a whole number.');
    }
    if (item.quantity > MAX_PER_LINE) throw new ShopError('BAD_QUANTITY', `You can buy at most ${MAX_PER_LINE} of one item.`);
    if (item.quantity > 0 && !product.inStock) throw new ShopError('OUT_OF_STOCK', `${product.name} is out of stock.`);
    this.lines = this.lines.filter((l) => !(l.productId === item.productId && l.colour === item.colour));
    if (item.quantity > 0) this.lines.push({ productId: item.productId, colour: item.colour, quantity: item.quantity });
    return this.getCart();
  }

  applyCoupon(code: string): Cart {
    const wanted = String(code ?? '').trim().toUpperCase();
    const rule = COUPONS.find((c) => c.code === wanted);
    if (!rule) throw new ShopError('COUPON_INVALID', `"${wanted}" isn't a valid coupon code.`);
    const cart = this.getCart();
    if (cart.subtotal === 0) throw new ShopError('CART_EMPTY', 'The cart is empty. Add something before applying a coupon.');
    const refusal = rule.refuse?.(cart.subtotal);
    if (refusal) throw new ShopError('COUPON_INVALID', refusal);
    this.coupon = rule;
    return this.getCart();
  }

  removeCoupon(): Cart {
    this.coupon = null;
    return this.getCart();
  }

  // --------------------------------------------------------------- shopper

  getUser(): User | null {
    return this.signedIn ? DEMO_USER : null;
  }

  signIn(): User {
    this.signedIn = true;
    return DEMO_USER;
  }

  signOut(): void {
    this.signedIn = false;
  }

  private requireUser(): User {
    if (!this.signedIn) throw new ShopError('NOT_SIGNED_IN', 'Nobody is signed in. The shopper has to sign in first.');
    return DEMO_USER;
  }

  getAddress(): Address | null {
    this.requireUser();
    return this.address;
  }

  saveAddress(input: Partial<Record<keyof Address, unknown>>): Address {
    this.requireUser();
    this.address = checkAddress(input);
    return this.address;
  }

  // ---------------------------------------------------------------- orders

  getDeliverySlots(): DeliverySlot[] {
    return deliverySlots(this.now());
  }

  previewOrder(slotId: string): OrderPreview {
    this.requireUser();
    const cart = this.getCart();
    if (!cart.lines.length) throw new ShopError('CART_EMPTY', 'The cart is empty, so there is nothing to order.');
    if (!this.address) throw new ShopError('ADDRESS_MISSING', 'There is no delivery address yet. Save one first.');
    const slots = this.getDeliverySlots();
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) throw new ShopError('SLOT_NOT_FOUND', `"${String(slotId)}" isn't a delivery slot. The slots are: ${slots.map((s) => s.id).join(', ')}.`);
    return { cart, address: this.address, slot, total: cart.total };
  }

  placeOrder(slotId: string): Order {
    const { cart, address, slot, total } = this.previewOrder(slotId);
    const order: Order = {
      id: `NB-${this.nextOrder++}`,
      placedAt: this.now().toISOString(),
      lines: cart.lines,
      subtotal: cart.subtotal,
      discount: cart.discount,
      deliveryFee: cart.deliveryFee,
      total,
      coupon: cart.coupon?.code ?? null,
      address,
      slot,
      payment: 'Pay on delivery',
      status: 'Confirmed'
    };
    this.orders.unshift(order);
    this.lines = [];
    this.coupon = null;
    return order;
  }

  getOrders(): Order[] {
    this.requireUser();
    return this.orders;
  }

  getOrder(id: string): Order {
    this.requireUser();
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new ShopError('ORDER_NOT_FOUND', `There is no order "${String(id)}".`);
    return order;
  }
}
