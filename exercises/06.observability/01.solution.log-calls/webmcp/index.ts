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

  // ✅ 5.1 the order tools are registered only while someone is signed in
  let signedIn: AbortController | undefined;
  const sync = (user: User | null) => {
    if (user && !signedIn) {
      signedIn = new AbortController();
      void registerOrderTools(shop, { signal: signedIn.signal });
    } else if (!user && signedIn) {
      // Aborting the signal unregisters every tool that was registered with it.
      signedIn.abort();
      signedIn = undefined;
    }
  };
  sync(shop.getUser());
  shop.onUserChange(sync);

  // 🔥 6.1 The browser fires its own events when an agent calls a tool. Log them too:
  //    document.modelContext.addEventListener('toolactivated', (event) => shop.log.record({ tool: event.toolName, outcome: 'activated' }));
  //    and the same for 'toolcancel', with outcome 'cancelled'.
}
