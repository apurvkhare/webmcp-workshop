/**
 * Tools for the cart. view_cart and apply_coupon are finished. add_to_cart is the one to work on.
 */
import { errorText, formatINR, type Cart, type Shop } from '@shop';

const describeCart = (cart: Cart) =>
  cart.lines.length
    ? JSON.stringify({
        lines: cart.lines.map((l) => ({ productId: l.productId, name: l.name, colour: l.colour, quantity: l.quantity, lineTotal: l.lineTotal })),
        coupon: cart.coupon?.code ?? null,
        discount: cart.discount,
        deliveryFee: cart.deliveryFee,
        total: cart.total
      })
    : 'The cart is empty.';

export async function registerCartTools(shop: Shop) {
  // A tool with no input needs no inputSchema.
  const viewCart: ModelContextTool = {
    name: 'view_cart',
    description: 'See what is in the cart, as JSON: each line, the coupon, the discount, the delivery fee and the total, in INR.',
    async execute() {
      shop.ui.showCart();
      return describeCart(await shop.getCart());
    }
  };

  const addToCart: ModelContextTool = {
    name: 'add_to_cart',
    description: 'Add a product to the cart in one of its colours. Get the product id and its colours from search_products first.',
    inputSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'A product id from search_products, for example "hp-102".' },
        colour: { type: 'string', description: "One of the product's colours, in lowercase." },
        quantity: { type: 'integer', minimum: 1, maximum: 5, default: 1, description: 'How many to add. 1 if left out.' }
      },
      // 🔨 2.2 productId and colour must always be sent. Say so here: required: ['productId', 'colour']
    },
    async execute(input) {
      const { productId, colour, quantity = 1 } = input;
      // 🔨 2.2 Check the input before using it. For each problem, return a sentence that starts with "Error:" and says how to fix the call.
      // 💡 const product = typeof productId === 'string' ? await shop.getProduct(productId) : null;
      // 💡 No such product: tell the agent to call search_products. Wrong colour: list product.colours. Quantity: a whole number from 1 to 5.
      // 💡 Then wrap the three lines below in try { … } catch (error) { return errorText(error); }, as apply_coupon does.
      // 🧠 Chrome does not check input against inputSchema. An agent can send a colour that doesn't exist, or quantity "two".
      // 🧠 Return the problem, don't throw it. A thrown error reaches the agent only as "the invocation failed", without your message. Returned text it can act on.
      // 📡 In the WebMCP pane, run add_to_cart with productId "hp-103" and colour "black". Before: Error. After: an answer listing blue and red.
      // 🧪 A good call adds to the cart. An unknown id, a wrong colour, a bad quantity and an out-of-stock product each return "Error: …".
      const cart = await shop.addToCart({ productId, colour, quantity });
      shop.ui.showCart();
      return `Added ${quantity} × ${productId} (${colour}). The cart has ${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'}, total ${formatINR(cart.total)}.`;
    }
  };

  const applyCoupon: ModelContextTool = {
    name: 'apply_coupon',
    description: 'Apply a coupon code to the cart. Returns the discount and the new total, or the reason the code was refused.',
    inputSchema: {
      type: 'object',
      properties: { code: { type: 'string', description: 'The coupon code, for example "DEVFEST10".' } },
      required: ['code']
    },
    async execute(input) {
      try {
        const cart = await shop.applyCoupon(String(input.code ?? ''));
        shop.ui.showCart();
        return `Applied ${cart.coupon?.code}: ${formatINR(cart.discount)} off. The total is now ${formatINR(cart.total)}.`;
      } catch (error) {
        return errorText(error);
      }
    }
  };

  await document.modelContext.registerTool(viewCart);
  await document.modelContext.registerTool(addToCart);
  await document.modelContext.registerTool(applyCoupon);
}
