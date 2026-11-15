# ✅ Namma Bazaar, agent-ready

This is the finished app: the shop with every step of the workshop done. `npm start -- --app app` runs it.

## What the page offers an agent

| Tool | What it does | Notes |
|---|---|---|
| `search_products` | Search the catalogue by words, category, price and rating | Read-only |
| `get_reviews` | Customer reviews of one product | Read-only, untrusted content |
| `view_cart` | The cart, with discount, delivery fee and total | Read-only |
| `add_to_cart` | Add a product in one of its colours | Checks its input |
| `apply_coupon` | Apply a coupon code | |
| `get_delivery_slots` | The slots an order can be delivered in | Read-only. Only while signed in |
| `place_order` | Order the cart | Consequential. The shopper confirms in the page. Only while signed in |
| `get_orders` | The shopper's orders | Read-only. Only while signed in |
| `set_delivery_address` | Fill in the address form on the checkout page | A form tool. The shopper presses Save. Only while the form is on the page |

## Try it

1. Open the **Tools** tab and run `search_products` with `{ "query": "wireless headphones", "maxPrice": 5000, "minRating": 4 }`.
2. Run `add_to_cart` with `{ "productId": "hp-102", "colour": "black" }`, then `apply_coupon` with `{ "code": "DEVFEST10" }`.
3. Sign in with the **Sign in** link. Three more tools appear.
4. Run `get_delivery_slots`, then `place_order` with the first slot's id. Confirm in the dialog.
5. Open the **Activity** tab: every call is there.

Or open the **Agent view** tab and press **Shop with tools** to have a script do all of it.

## Where the code is

| File | What is in it | Step |
|---|---|---|
| `webmcp/index.ts` | `setupWebMCP(shop)`: feature detection, and the order tools following sign-in | 5.1 |
| `webmcp/catalog-tools.ts` | `search_products`, `get_reviews` | 2.1, 4.1 |
| `webmcp/cart-tools.ts` | `view_cart`, `add_to_cart`, `apply_coupon` | 2.2, 4.1 |
| `webmcp/order-tools.ts` | `get_delivery_slots`, `place_order`, `get_orders` | 4.2, 5.1 |
| `webmcp/logging.ts` | `withLogging()` | 6.1 |
| `ui/AddressForm.tsx` | The form that is also a tool | 3.1 |

To build it yourself, one step at a time: `npm run go 2.1`, then `npm start`.
