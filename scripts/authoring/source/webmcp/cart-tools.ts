//#file 2.2
/**
 * Tools for the cart. view_cart and apply_coupon are finished. add_to_cart is the one to work on.
 */
import { errorText, formatINR, type Cart, type Shop } from '@shop';
//#step 6.1 given
import { withLogging } from './logging.ts';
//#end

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
    //#step 4.1
    // #done read-only, like search_products
    annotations: { readOnlyHint: true },
    //#gap
    // 🔨 4.1 Looking at the cart changes nothing either.
    //#end
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
      //#step 2.2
      // #done the agent is told which fields it must send
      required: ['productId', 'colour']
      //#gap
      // 🔨 2.2 productId and colour must always be sent. Say so here: required: ['productId', 'colour']
      //#end
    },
    async execute(input) {
      const { productId, colour, quantity = 1 } = input;
      //#step 2.2
      // #done nothing checks the input against the schema, so execute does, and each answer says how to fix the call
      const product = typeof productId === 'string' ? await shop.getProduct(productId) : null;
      if (!product) return `Error: no product has the id "${productId}". Call search_products to find product ids.`;
      if (!product.colours.includes(colour)) return `Error: ${product.name} comes in ${product.colours.join(', ')}. Pass one of those as colour.`;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) return 'Error: quantity must be a whole number from 1 to 5.';
      try {
        const cart = await shop.addToCart({ productId, colour, quantity });
        shop.ui.showCart();
        return `Added ${quantity} × ${product.name} (${colour}). The cart has ${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'}, total ${formatINR(cart.total)}.`;
      } catch (error) {
        // What only the shop knows: out of stock, more than 5 of one item.
        return errorText(error);
      }
      //#gap
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
      //#end
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

  //#step 6.1 given
  await document.modelContext.registerTool(withLogging(viewCart, shop.log));
  await document.modelContext.registerTool(withLogging(addToCart, shop.log));
  await document.modelContext.registerTool(withLogging(applyCoupon, shop.log));
  //#before
  await document.modelContext.registerTool(viewCart);
  await document.modelContext.registerTool(addToCart);
  await document.modelContext.registerTool(applyCoupon);
  //#end
}
