//#file 4.2
/**
 * Tools for ordering. place_order spends the shopper's money, so it is the one to be careful with.
 */
import { errorText, formatINR, type Shop } from '@shop';
//#step 6.1 given
import { withLogging } from './logging.ts';
//#end

//#step 5.1
// #done `options` carries the AbortSignal that unregisters these tools
export async function registerOrderTools(shop: Shop, options: ModelContextRegisterToolOptions = {}) {
//#gap
// 🔨 5.1 Take a second parameter, options: ModelContextRegisterToolOptions = {}, and pass it to the three registerTool calls at the bottom.
// 💡 registerTool(tool, options). options.signal is the AbortSignal that will unregister the tool.
export async function registerOrderTools(shop: Shop) {
//#before
export async function registerOrderTools(shop: Shop) {
//#end
  const getDeliverySlots: ModelContextTool = {
    name: 'get_delivery_slots',
    description: 'List the delivery slots an order can be booked into, earliest first, as JSON: id and label. Pass an id to place_order.',
    annotations: { readOnlyHint: true },
    async execute() {
      return JSON.stringify(await shop.getDeliverySlots());
    }
  };

  const placeOrder: ModelContextTool = {
    name: 'place_order',
    description:
      'Place an order for everything in the cart, delivered to the saved address in the given slot, paid on delivery. The shopper is shown the order in the page and has to confirm it.',
    inputSchema: {
      type: 'object',
      properties: { slotId: { type: 'string', description: 'A slot id from get_delivery_slots.' } },
      required: ['slotId']
    },
    //#step 4.2
    // #done a hint for the agent and the browser: this one matters, and can't be taken back
    annotations: { consequentialHint: true },
    //#gap
    // 🔨 4.2 Placing an order matters and can't be taken back. Say so: annotations: { consequentialHint: true }
    // 🧠 It is a hint. An agent or a browser may ask the shopper first because of it. Chrome itself shows no prompt today.
    //#end
    //#step 4.2
    async execute(input, { signal }) {
    //#before
    async execute(input) {
    //#end
      try {
        // The server works the order out again from the cart as it is now, not from what the agent remembers.
        const preview = await shop.previewOrder(String(input.slotId ?? ''));
        //#step 4.2
        // #done the shopper says yes in the page before anything is ordered
        const confirmed = await shop.ui.confirm({
          title: 'Place this order?',
          lines: [
            ...preview.cart.lines.map((l) => `${l.quantity} × ${l.name} (${l.colour})`),
            `Deliver to ${preview.address.fullName}, ${preview.address.line1}, ${preview.address.city} ${preview.address.pincode}`,
            preview.slot.label,
            `Pay on delivery: ${formatINR(preview.total)}`
          ],
          confirmLabel: `Place order · ${formatINR(preview.total)}`,
          // If the agent or the shopper cancels the call, the dialog closes.
          signal
        });
        if (!confirmed) return 'The shopper did not confirm, so nothing was ordered. Do not try again unless they ask.';
        //#gap
        // 🔨 4.2 Ask the shopper before ordering. If they don't say yes, return a sentence that says nothing was ordered.
        // 💡 const confirmed = await shop.ui.confirm({ title, lines, confirmLabel, signal });
        // 💡 lines: what they are agreeing to. The items (preview.cart.lines), the address (preview.address), preview.slot.label, and formatINR(preview.total).
        // 💡 signal is execute's second argument: async execute(input, { signal }). Passing it on closes the dialog if the call is cancelled.
        // 🧠 The spec has no way to ask the user yet (requestUserInteraction is gone). The page is yours, so the question goes in the page.
        // 📡 Sign in, add something to the cart, and run place_order from the WebMCP pane. Decline once, then confirm once.
        // 🧪 Declining orders nothing. Confirming orders. The dialog shows the total. Cancelling the call closes the dialog.
        //#end
        const order = await shop.placeOrder(preview.slot.id);
        shop.ui.showOrder(order.id);
        return `Order ${order.id} is placed: ${formatINR(order.total)}, pay on delivery, arriving ${order.slot.label}.`;
      } catch (error) {
        // Nobody signed in, an empty cart, no address, an unknown slot: the shop says which.
        return errorText(error);
      }
    }
  };

  const getOrders: ModelContextTool = {
    name: 'get_orders',
    description: "List the shopper's orders, newest first, as JSON: id, when it was placed, items, total in INR, status and delivery slot.",
    annotations: { readOnlyHint: true },
    async execute() {
      try {
        const orders = await shop.getOrders();
        if (!orders.length) return 'The shopper has no orders yet.';
        return JSON.stringify(
          orders.map((o) => ({ id: o.id, placedAt: o.placedAt, items: o.lines.map((l) => `${l.quantity} × ${l.name}`), total: o.total, status: o.status, slot: o.slot.label }))
        );
      } catch (error) {
        return errorText(error);
      }
    }
  };

  //#step 6.1 given
  await document.modelContext.registerTool(withLogging(getDeliverySlots, shop.log), options);
  await document.modelContext.registerTool(withLogging(placeOrder, shop.log), options);
  await document.modelContext.registerTool(withLogging(getOrders, shop.log), options);
  //#before
  //#step 5.1
  await document.modelContext.registerTool(getDeliverySlots, options);
  await document.modelContext.registerTool(placeOrder, options);
  await document.modelContext.registerTool(getOrders, options);
  //#before
  await document.modelContext.registerTool(getDeliverySlots);
  await document.modelContext.registerTool(placeOrder);
  await document.modelContext.registerTool(getOrders);
  //#end
  //#end
}
