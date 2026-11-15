# ✅ 2.2 Validate input in add_to_cart

This folder is the finished step. Every ✅ comment in the code marks work from this step or an earlier one.

**What was built:** `add_to_cart` requires `productId` and `colour`, checks its input inside `execute`, and returns every problem as an `Error: …` sentence the agent can act on.

**Where:** `webmcp/cart-tools.ts`: the 2.2 changes, in `add_to_cart`.

**📡 What to look for:** Run `add_to_cart` with `{ "productId": "hp-103", "colour": "black" }`: the answer lists the colours it does come in. Run it with `{ "productId": "hp-102", "colour": "black" }`: the cart badge in the header goes up.

## Explain it back

1. What does Chrome do when an agent's input doesn't match `inputSchema`?
2. What does the agent receive when `execute` throws, and what does it receive when `execute` returns `Error: …`?
3. Which bad inputs do you catch in `execute`, and which does the server catch? Why both?

**Next:** section 3, `npm run go 3.1`
