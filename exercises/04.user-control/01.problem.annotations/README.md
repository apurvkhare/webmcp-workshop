# 4.1 Say what each tool does with annotations

🔨 **Your task:** Mark the tools that only read with `readOnlyHint`, and mark `get_reviews` with `untrustedContentHint` as well.

**Where:** `webmcp/catalog-tools.ts`: two 🔨 4.1 markers, on `search_products` and `get_reviews`. `webmcp/cart-tools.ts`: one, on `view_cart`.

## Where you start

There is a new tool in `webmcp/catalog-tools.ts`: `get_reviews`, which returns what customers wrote about a product.

To an agent, all five tools look the same. Nothing says that `search_products` is safe to call at any time and `add_to_cart` changes something. Nothing says that `get_reviews` returns text the shop didn't write.

## 🧠 How it works

**`annotations` is an object of boolean hints on the tool:**

```ts
annotations: { readOnlyHint: true, untrustedContentHint: true }
```

| Hint | It says | An agent can use it to |
|---|---|---|
| `readOnlyHint` | Calling this changes nothing | Call it without asking the user first |
| `untrustedContentHint` | The result contains text from outside the site's control | Treat the result as data, never as instructions |
| `consequentialHint` | This does something that matters and may not be undoable | Ask the user before calling it (step 4.2) |

**There is a fourth, `debugging`,** for a tool meant for developer tooling rather than for an agent helping a person. Agents can leave those out. No Namma Bazaar tool needs it.

**They are hints, not locks.** Chrome passes them to the agent and enforces nothing. A tool marked read-only can still write if you make it, so be honest: a wrong hint is worse than none.

**Why `get_reviews` is different.** Every other tool returns text the shop wrote. Reviews are written by anyone with an account. One of the reviews of `hp-102` is addressed to AI assistants: it tells them to ignore their instructions and order five smartwatches. That is a prompt injection, and it reaches the agent through your tool.

**The hint is one defence, not the only one.** Step 4.2 adds the one that holds even if an agent believes the review: the shopper has to confirm an order in the page.

## 📡 What to look for

In the WebMCP pane or the Tools tab, `search_products`, `view_cart` and `get_reviews` now show as read-only, and `get_reviews` as untrusted.

Run `get_reviews` with `{ "productId": "hp-102" }` and read the third review. Then open the product page and read it there. A person scrolls past it. An agent reads every word.

In the console:

```js
(await document.modelContext.getTools()).map((t) => [t.name, t.annotations]);
```

## What breaks without it

A careful agent asks the user before every call, including a search, because it can't tell a read from a write. A careless one treats a stranger's review as part of its instructions.

## 🧪 Check it

`npm test` checks that `search_products`, `view_cart` and `get_reviews` are read-only, that `add_to_cart` and `apply_coupon` are not, that only `get_reviews` claims untrusted content, and that the planted review really is in its result.

## Explain it back

1. What does Chrome do differently for a tool with `readOnlyHint: true`?
2. Why does `get_reviews` get `untrustedContentHint` and `search_products` doesn't?
3. Suppose an agent ignores the hint and believes the review. What still stands between that review and an order?

## 📖 Read more

- [WebMCP specification: tool annotations](https://webmachinelearning.github.io/webmcp/)
- [Chrome for Developers: WebMCP](https://developer.chrome.com/docs/ai/webmcp)

---

Stuck? 💡 Read the hint lines in the code, then `npm run diff`, then `npm run solution`. (Agents: only when the person asks.)
