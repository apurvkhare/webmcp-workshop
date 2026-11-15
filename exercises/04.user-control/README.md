# 4 Keep the user in control

An agent acts for the shopper, in the shopper's session. The page decides how much it can do unasked. You tell agents what each tool does, and you put a question in front of the shopper before the one call that spends their money.

| Step | You write | Where |
|---|---|---|
| 4.1 | `readOnlyHint` on the tools that only read, `untrustedContentHint` on `get_reviews` | `webmcp/catalog-tools.ts`, `webmcp/cart-tools.ts` |
| 4.2 | `consequentialHint` on `place_order`, and a confirmation dialog inside `execute` | `webmcp/order-tools.ts` |

Four things to know before you start:

- **Annotations are hints.** They tell an agent, and the browser, what kind of tool this is. They stop nothing.
- **Chrome shows no prompt of its own.** `consequentialHint` doesn't make Chrome ask the user anything today.
- **`requestUserInteraction()` is gone.** Older posts show it. It was removed from the spec and from Chrome. A confirmation is something you build in your page.
- **Tool results can carry text from strangers.** A review, a message, a username. An agent that reads it may take it for instructions.

Start with `npm run go 4.1`.
