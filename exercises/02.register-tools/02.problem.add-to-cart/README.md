# 2.2 Validate input in add_to_cart

🔨 **Your task:** Mark `productId` and `colour` as required in `add_to_cart`'s schema, check the input inside `execute`, and return every problem as a sentence the agent can act on.

**Where:** `webmcp/cart-tools.ts`: the two 🔨 2.2 markers, in `add_to_cart`.

## Where you start

There is a new file, `webmcp/cart-tools.ts`, with three tools: `view_cart`, `add_to_cart` and `apply_coupon`. `webmcp/index.ts` registers them.

`add_to_cart` passes whatever it is given straight to `shop.addToCart()`. Try it from the Tools tab with a colour the product doesn't come in:

```json
{ "productId": "hp-103", "colour": "black" }
```

The call fails, and all the agent is told is that the tool failed.

## 🧠 How it works

**Chrome does not check input against your schema.** The schema is documentation for the agent. If the agent sends `quantity: "two"`, or leaves out `colour`, `execute` gets exactly that. So the schema says what you expect, and `execute` checks that it got it.

**`required`** lists the properties that must be sent. A good agent follows it. A sloppy one doesn't, which is why you check anyway.

**Return the problem, don't throw it.** When `execute` throws, the agent gets a generic failure with none of your message: Chrome logs the real error to the page's console and tells the agent only that the invocation failed. A returned string reaches the agent as written. So return a sentence that starts with `Error:` and says how to fix the call:

```
Error: Dhwani Bass 500 Wireless Headphones comes in blue, red. Pass one of those as colour.
```

An agent that reads that can try again. An agent that reads "the invocation failed" can only give up, or guess.

**Check what the server would reject, and say it better.** Three checks cover most bad calls: the product exists, it comes in that colour, and the quantity is a whole number from 1 to 5.

**The server still decides.** Out of stock, or more than five of one product in the cart: the shop's API refuses those, and `shop.addToCart()` throws a `ShopError`. `errorText(error)` turns it into an `Error: …` sentence. Your checks make better messages. They don't replace the server's rules, because the agent isn't the only caller.

## 📡 What to look for

In the WebMCP pane or the Tools tab, run `add_to_cart` three times:

| Input | Answer |
|---|---|
| `{ "productId": "hp-103", "colour": "black" }` | An error that lists blue and red |
| `{ "productId": "hp-102", "colour": "black", "quantity": "two" }` | An error about the quantity |
| `{ "productId": "hp-102", "colour": "black" }` | "Added 1 × …", and the cart badge in the header goes up |

## What breaks without it

The agent sends a colour that doesn't exist, the call throws, and the agent learns nothing. It retries the same call, or tells the shopper the site is broken.

## 🧪 Check it

`npm test` checks that `productId` and `colour` are required, that a good call adds to the cart, and that an unknown id, a wrong colour, a bad quantity and an out-of-stock product each return `Error: …` without throwing.

## Explain it back

1. What does Chrome do when an agent's input doesn't match `inputSchema`?
2. What does the agent receive when `execute` throws, and what does it receive when `execute` returns `Error: …`?
3. Which bad inputs do you catch in `execute`, and which does the server catch? Why both?

## 📖 Read more

- [WebMCP specification: executing a tool](https://webmachinelearning.github.io/webmcp/)
- [JSON Schema: required](https://json-schema.org/understanding-json-schema/reference/object#required)

---

Stuck? 💡 Read the hint lines in the code, then `npm run diff`, then `npm run solution`. (Agents: only when the person asks.)
