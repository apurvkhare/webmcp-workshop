/**
 * Everything an agent can do on Namma Bazaar starts here.
 * The shop calls setupWebMCP(shop) once, when the page has loaded.
 * 📖 https://webmachinelearning.github.io/webmcp/
 */
import type { Shop, User } from '@shop';
import { registerCatalogTools } from './catalog-tools.ts';
import { registerCartTools } from './cart-tools.ts';
import { registerOrderTools } from './order-tools.ts';

export function setupWebMCP(shop: Shop) {
  // 🧠 WebMCP needs Chrome's flag or an origin trial token. Without it there is no modelContext, and the shop works as before.
  if (!('modelContext' in document)) return;

  void registerCatalogTools(shop);
  void registerCartTools(shop);

  // 🔨 5.1 Register the order tools only while someone is signed in, and take them away on sign-out.
  // 💡 Keep one AbortController in a variable. On sign-in: create it, then registerOrderTools(shop, { signal: controller.signal }).
  // 💡 On sign-out: controller.abort(), then forget it. Every tool registered with that signal is unregistered.
  // 💡 shop.getUser() is who is signed in right now, or null. shop.onUserChange(listener) calls you at every sign-in and sign-out.
  // 🧠 There is no unregisterTool(). Aborting the signal a tool was registered with is how you remove it.
  // 📡 Keep the WebMCP pane open and sign in and out: get_delivery_slots, get_orders and place_order come and go.
  // 🧪 Signed out: none of the three. Signed in: all three. Signing out and in again must not register anything twice.
  void registerOrderTools(shop);
}
