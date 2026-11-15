/**
 * Tools for ordering. place_order spends the shopper's money, so it is the one to be careful with.
 */
import { errorText, formatINR, type Shop } from '@shop';
import { withLogging } from './logging.ts';

// ✅ 5.1 `options` carries the AbortSignal that unregisters these tools
export async function registerOrderTools(shop: Shop, options: ModelContextRegisterToolOptions = {}) {
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
    // ✅ 4.2 a hint for the agent and the browser: this one matters, and can't be taken back
    annotations: { consequentialHint: true },
    async execute(input, { signal }) {
      try {
        // The server works the order out again from the cart as it is now, not from what the agent remembers.
        const preview = await shop.previewOrder(String(input.slotId ?? ''));
        // ✅ 4.2 the shopper says yes in the page before anything is ordered
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

  await document.modelContext.registerTool(withLogging(getDeliverySlots, shop.log), options);
  await document.modelContext.registerTool(withLogging(placeOrder, shop.log), options);
  await document.modelContext.registerTool(withLogging(getOrders, shop.log), options);
}
