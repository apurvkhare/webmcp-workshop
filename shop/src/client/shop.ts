/**
 * The shop, as the page sees it: one object that the UI and the WebMCP tools both call.
 * It talks to the server through a ShopBackend, keeps the state the UI renders (who is signed in, the cart,
 * an open confirmation, the agent log), and tells listeners when that state changes.
 *
 * Step code gets the narrower `Shop` type. The UI gets `ShopApp`, which adds what only a person does.
 */
import type { CartItem, ShopBackend } from '../core/backend.ts';
import { CATEGORIES, type Address, type Cart, type Category, type DeliverySlot, type Order, type OrderPreview, type Product, type Review, type SearchFilters, type User } from '../core/types.ts';

export type Outcome = 'ok' | 'error' | 'threw' | 'activated' | 'cancelled';

/** One line of the agent log. `withLogging` in step 6.1 writes these. */
export interface AgentLogEntry {
  /** The tool's name. */
  tool: string;
  /** What the agent sent. */
  input?: unknown;
  /** "ok", "error" (the tool returned an Error: text), or "threw". */
  outcome: Outcome;
  /** How long execute took, in milliseconds. */
  ms?: number;
  /** What the tool returned, or the error it threw. */
  result?: string;
}

export interface LoggedCall extends AgentLogEntry {
  id: number;
  at: string;
}

export interface AgentLog {
  /** Adds a line to the drawer's Activity tab and sends it to the shop's server. */
  record(entry: AgentLogEntry): void;
}

export interface ConfirmRequest {
  title: string;
  /** What the shopper is agreeing to, one fact per line. */
  lines: string[];
  /** The text on the button that says yes. */
  confirmLabel?: string;
  /** When this aborts, the dialog closes and the answer is false. */
  signal?: AbortSignal;
}

export interface ShopUI {
  /** Each show* moves the page, so the shopper sees what the agent just did. */
  showSearch(filters: SearchFilters): void;
  showProduct(productId: string): void;
  showCart(): void;
  showCheckout(): void;
  showOrder(orderId: string): void;
  /** Opens a dialog in the page and resolves true only if the shopper presses the confirm button. */
  confirm(request: ConfirmRequest): Promise<boolean>;
}

/** What the WebMCP steps work with. */
export interface Shop {
  readonly categories: readonly Category[];
  searchProducts(filters: SearchFilters): Promise<Product[]>;
  getProduct(productId: string): Promise<Product | null>;
  getReviews(productId: string): Promise<Review[]>;
  getCart(): Promise<Cart>;
  addToCart(item: CartItem): Promise<Cart>;
  applyCoupon(code: string): Promise<Cart>;
  /** Who is signed in right now, or null. */
  getUser(): User | null;
  /** Calls the listener whenever someone signs in or out. Returns a function that stops listening. */
  onUserChange(listener: (user: User | null) => void): () => void;
  saveAddress(address: Address): Promise<Address>;
  getDeliverySlots(): Promise<DeliverySlot[]>;
  /** Everything about the order that would be placed: the cart, the address, the slot and the total. Changes nothing. */
  previewOrder(slotId: string): Promise<OrderPreview>;
  placeOrder(slotId: string): Promise<Order>;
  getOrders(): Promise<Order[]>;
  readonly ui: ShopUI;
  readonly log: AgentLog;
}

export interface PendingConfirm extends Omit<ConfirmRequest, 'signal'> {
  id: number;
  answer(confirmed: boolean): void;
}

export interface ShopState {
  /** False until the first load of the session and the cart has finished. */
  ready: boolean;
  user: User | null;
  cart: Cart;
  confirm: PendingConfirm | null;
  log: LoggedCall[];
  /** Goes up whenever something on the server changed. Pages that fetched their own data reload on it. */
  version: number;
}

export interface ShopApp extends Shop {
  getState(): ShopState;
  subscribe(listener: () => void): () => void;
  init(): Promise<void>;
  signIn(): Promise<User>;
  signOut(): Promise<void>;
  setQuantity(item: CartItem): Promise<Cart>;
  removeCoupon(): Promise<Cart>;
  getAddress(): Promise<Address | null>;
  getOrder(orderId: string): Promise<Order>;
  clearLog(): void;
  reset(): Promise<void>;
}

export interface ShopHooks {
  navigate(path: string): void;
  /** Receives every log line, for example to send it to the server. */
  sink?(entry: LoggedCall): void;
}

export const EMPTY_CART: Cart = { lines: [], itemCount: 0, subtotal: 0, coupon: null, discount: 0, deliveryFee: 0, total: 0 };

export function searchPath(filters: SearchFilters): string {
  const params = new URLSearchParams();
  for (const key of ['query', 'category', 'maxPrice', 'minRating', 'sort'] as const) {
    const value = filters[key];
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `/search?${query}` : '/search';
}

export function createShop(backend: ShopBackend, hooks: ShopHooks): ShopApp {
  let state: ShopState = { ready: false, user: null, cart: EMPTY_CART, confirm: null, log: [], version: 0 };
  const listeners = new Set<() => void>();
  const userListeners = new Set<(user: User | null) => void>();
  let ids = 0;

  const set = (patch: Partial<ShopState>) => {
    const before = state.user;
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
    if (state.user?.id !== before?.id) for (const listener of userListeners) listener(state.user);
  };
  const changed = (patch: Partial<ShopState> = {}) => set({ ...patch, version: state.version + 1 });
  const withCart = async (work: Promise<Cart>) => {
    const cart = await work;
    changed({ cart });
    return cart;
  };

  const shop: ShopApp = {
    categories: CATEGORIES,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async init() {
      const [user, cart] = await Promise.all([backend.getUser(), backend.getCart()]);
      set({ ready: true, user, cart });
    },

    searchProducts: (filters) => backend.searchProducts(filters),
    getProduct: (id) => backend.getProduct(id),
    getReviews: (id) => backend.getReviews(id),

    getCart: () => withCart(backend.getCart()),
    addToCart: (item) => withCart(backend.addToCart(item)),
    setQuantity: (item) => withCart(backend.setQuantity(item)),
    applyCoupon: (code) => withCart(backend.applyCoupon(code)),
    removeCoupon: () => withCart(backend.removeCoupon()),

    getUser: () => state.user,
    onUserChange(listener) {
      userListeners.add(listener);
      return () => userListeners.delete(listener);
    },
    async signIn() {
      const user = await backend.signIn();
      changed({ user });
      return user;
    },
    async signOut() {
      await backend.signOut();
      state.confirm?.answer(false);
      changed({ user: null });
    },

    getAddress: () => backend.getAddress(),
    async saveAddress(address) {
      const saved = await backend.saveAddress(address);
      changed();
      return saved;
    },
    getDeliverySlots: () => backend.getDeliverySlots(),
    previewOrder: (slotId) => backend.previewOrder(slotId),
    async placeOrder(slotId) {
      const order = await backend.placeOrder(slotId);
      changed({ cart: await backend.getCart() });
      return order;
    },
    getOrders: () => backend.getOrders(),
    getOrder: (id) => backend.getOrder(id),

    ui: {
      showSearch: (filters) => hooks.navigate(searchPath(filters)),
      showProduct: (id) => hooks.navigate(`/product/${encodeURIComponent(id)}`),
      showCart: () => hooks.navigate('/cart'),
      showCheckout: () => hooks.navigate('/checkout'),
      showOrder: (id) => hooks.navigate(`/orders/${encodeURIComponent(id)}`),
      confirm({ signal, ...request }) {
        return new Promise<boolean>((resolve) => {
          if (signal?.aborted) return resolve(false);
          // Only one question at a time: a newer one replaces an older one, which counts as a no.
          state.confirm?.answer(false);
          const id = ++ids;
          const answer = (confirmed: boolean) => {
            if (state.confirm?.id !== id) return;
            signal?.removeEventListener('abort', onAbort);
            set({ confirm: null });
            resolve(confirmed);
          };
          const onAbort = () => answer(false);
          signal?.addEventListener('abort', onAbort);
          set({ confirm: { ...request, id, answer } });
        });
      }
    },

    log: {
      record(entry) {
        const logged: LoggedCall = { ...entry, id: ++ids, at: new Date().toISOString() };
        set({ log: [logged, ...state.log].slice(0, 200) });
        hooks.sink?.(logged);
      }
    },
    clearLog: () => set({ log: [] }),

    async reset() {
      state.confirm?.answer(false);
      await backend.reset();
      const [user, cart] = await Promise.all([backend.getUser(), backend.getCart()]);
      changed({ user, cart, log: [] });
    }
  };
  return shop;
}
