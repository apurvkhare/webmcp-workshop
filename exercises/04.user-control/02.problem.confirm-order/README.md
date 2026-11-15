# 4.2 Ask before placing an order

🔨 **Your task:** Mark `place_order` with `consequentialHint`, and make it ask the shopper in the page before it orders anything.

**Where:** `webmcp/order-tools.ts`: the two 🔨 4.2 markers, in `place_order`.

## Where you start

There is a new file, `webmcp/order-tools.ts`, with three tools: `get_delivery_slots`, `place_order` and `get_orders`. `webmcp/index.ts` registers them.

`place_order` works, and that is the problem. Sign in, add something to the cart, and run it from the Tools tab with a slot id from `get_delivery_slots`. The order is placed at once. The shopper is told afterwards.

Reset with the drawer's **Reset demo data** before you go on.

## 🧠 How it works

**`consequentialHint: true`** says that this call matters and can't be taken back. An agent, or a browser, can use it to ask the user first. Chrome itself shows no prompt today, so the hint alone protects nobody.

**The page asks.** There is no browser API for "ask the user": `requestUserInteraction()` was removed from the spec and from Chrome. But `execute` is an async function running in your page, and your page already knows how to show a dialog. So `execute` opens one and waits:

```ts
async execute(input, { signal }) {
  const preview = await shop.previewOrder(input.slotId);
  const confirmed = await shop.ui.confirm({ title, lines, confirmLabel, signal });
  if (!confirmed) return 'The shopper did not confirm, so nothing was ordered. …';
  const order = await shop.placeOrder(preview.slot.id);
  …
}
```

The agent's call stays open for as long as the dialog does. From the agent's side, it is a slow tool.

**Show what they are agreeing to.** `shop.previewOrder(slotId)` asks the server what would be ordered: the cart as it is now, the saved address, the slot, the total. The dialog shows that, not what the agent said it was ordering. The agent may be wrong, or lying because a review told it to.

**The dialog belongs to the page, so the agent can't press its button.** A tool call can't click. Only the shopper can say yes.

**Say no clearly.** When the shopper declines, return a sentence that says nothing was ordered and that the agent shouldn't retry. A vague answer invites a second attempt.

**`signal` is `execute`'s second argument.** It aborts when the agent or the browser cancels the call. Pass it to `shop.ui.confirm()` and the dialog closes by itself, instead of sitting on screen for a call nobody is waiting for.

**The server is still the authority.** `shop.placeOrder()` is refused by the server if nobody is signed in, the cart is empty, or there is no address. The dialog is for the shopper's consent. It isn't the security boundary.

## 📡 What to look for

Sign in, add something to the cart, and run `get_delivery_slots`, then `place_order` with the first slot's id.

1. A dialog opens over the page with the items, the address, the slot and the total. The tool call is still running.
2. Press **Not now**. The agent's answer says nothing was ordered. The Orders page is empty.
3. Run it again and confirm. The answer has an order number, and the page shows the order.

## What breaks without it

An agent that misread the request, or believed the review from step 4.1, places an order the shopper never saw. On this shop it is cash on delivery. On yours it may be a card.

## 🧪 Check it

`npm test` checks that `place_order` is marked consequential, that declining orders nothing, that the dialog shows the items and the total, that confirming places the order, that cancelling the call closes the dialog, and that an empty cart is refused without asking.

## Explain it back

1. What does Chrome do when an agent calls a tool that has `consequentialHint: true`?
2. Why does the dialog show `preview`, which comes from the server, rather than the agent's input?
3. What happens to the dialog, and to the order, if the agent cancels the call while the dialog is open?

## 📖 Read more

- [WebMCP specification: tool annotations and execute](https://webmachinelearning.github.io/webmcp/)
- [MDN: AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

---

Stuck? 💡 Read the hint lines in the code, then `npm run diff`, then `npm run solution`. (Agents: only when the person asks.)
