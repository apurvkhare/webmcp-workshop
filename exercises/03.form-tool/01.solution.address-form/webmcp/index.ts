/**
 * Everything an agent can do on Namma Bazaar starts here.
 * The shop calls setupWebMCP(shop) once, when the page has loaded.
 * 📖 https://webmachinelearning.github.io/webmcp/
 */
import type { Shop } from '@shop';
import { registerCatalogTools } from './catalog-tools.ts';
import { registerCartTools } from './cart-tools.ts';

export function setupWebMCP(shop: Shop) {
  // 🧠 WebMCP needs Chrome's flag or an origin trial token. Without it there is no modelContext, and the shop works as before.
  if (!('modelContext' in document)) return;

  void registerCatalogTools(shop);
  void registerCartTools(shop);
}
