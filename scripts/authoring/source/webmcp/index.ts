/**
 * Everything an agent can do on Namma Bazaar starts here.
 * The shop calls setupWebMCP(shop) once, when the page has loaded.
 * 📖 https://webmachinelearning.github.io/webmcp/
 */
//#step 5.1 given
import type { Shop, User } from '@shop';
//#before
import type { Shop } from '@shop';
//#end
import { registerCatalogTools } from './catalog-tools.ts';
//#step 2.2 given
import { registerCartTools } from './cart-tools.ts';
//#end
//#step 4.2 given
import { registerOrderTools } from './order-tools.ts';
//#end

export function setupWebMCP(shop: Shop) {
  // 🧠 WebMCP needs Chrome's flag or an origin trial token. Without it there is no modelContext, and the shop works as before.
  if (!('modelContext' in document)) return;

  void registerCatalogTools(shop);
  //#step 2.2 given
  void registerCartTools(shop);
  //#end
  //#step 5.1

  // #done the order tools are registered only while someone is signed in
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
  //#gap

  // 🔨 5.1 Register the order tools only while someone is signed in, and take them away on sign-out.
  // 💡 Keep one AbortController in a variable. On sign-in: create it, then registerOrderTools(shop, { signal: controller.signal }).
  // 💡 On sign-out: controller.abort(), then forget it. Every tool registered with that signal is unregistered.
  // 💡 shop.getUser() is who is signed in right now, or null. shop.onUserChange(listener) calls you at every sign-in and sign-out.
  // 🧠 There is no unregisterTool(). Aborting the signal a tool was registered with is how you remove it.
  // 📡 Keep the WebMCP pane open and sign in and out: get_delivery_slots, get_orders and place_order come and go.
  // 🧪 Signed out: none of the three. Signed in: all three. Signing out and in again must not register anything twice.
  void registerOrderTools(shop);
  //#before
  //#step 4.2 given
  void registerOrderTools(shop);
  //#end
  //#end
  //#step 6.1 given

  // 🔥 6.1 The browser fires its own events when an agent calls a tool. Log them too:
  //    document.modelContext.addEventListener('toolactivated', (event) => shop.log.record({ tool: event.toolName, outcome: 'activated' }));
  //    and the same for 'toolcancel', with outcome 'cancelled'.
  //#end
}
