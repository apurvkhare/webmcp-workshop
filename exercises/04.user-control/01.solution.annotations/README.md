# ✅ 4.1 Say what each tool does with annotations

This folder is the finished step. Every ✅ comment in the code marks work from this step or an earlier one.

**What was built:** `search_products`, `view_cart` and `get_reviews` have `readOnlyHint`. `get_reviews` also has `untrustedContentHint`, because its result is text written by strangers.

**Where:** `webmcp/catalog-tools.ts` and `webmcp/cart-tools.ts`: the 4.1 changes.

**📡 What to look for:** The WebMCP pane or the Tools tab shows the three tools as read-only, and `get_reviews` as untrusted. Run `get_reviews` with `{ "productId": "hp-102" }` and read the third review: it is written for an agent, not for a shopper.

## Explain it back

1. What does Chrome do differently for a tool with `readOnlyHint: true`?
2. Why does `get_reviews` get `untrustedContentHint` and `search_products` doesn't?
3. Suppose an agent ignores the hint and believes the review. What still stands between that review and an order?

**Next:** `npm run go 4.2`
