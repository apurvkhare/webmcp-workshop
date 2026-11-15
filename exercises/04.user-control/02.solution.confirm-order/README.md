# ✅ 4.2 Ask before placing an order

This folder is the finished step. Every ✅ comment in the code marks work from this step or an earlier one.

**What was built:** `place_order` has `consequentialHint`, and its `execute` opens a confirmation dialog in the page and orders only if the shopper says yes. The dialog closes if the call is cancelled.

**Where:** `webmcp/order-tools.ts`: the 4.2 changes, in `place_order`.

**📡 What to look for:** Sign in, add something to the cart, run `get_delivery_slots`, then `place_order` with the first slot's id. A dialog shows the items, the address, the slot and the total while the call waits. Press Not now once: nothing is ordered. Confirm once: the answer has an order number.

## Explain it back

1. What does Chrome do when an agent calls a tool that has `consequentialHint: true`?
2. Why does the dialog show `preview`, which comes from the server, rather than the agent's input?
3. What happens to the dialog, and to the order, if the agent cancels the call while the dialog is open?

**Next:** section 5, `npm run go 5.1`
