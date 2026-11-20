/**
 * Tools for looking around the catalogue.
 */
//#step 4.1 given
import { errorText, type Product, type Shop } from '@shop';
//#before
import type { Product, Shop } from '@shop';
//#end
//#step 6.1 given
import { withLogging } from './logging.ts';
//#end

/** What an agent needs to choose a product and take the next step. Not the whole record: tool results should stay small. */
const summarise = (p: Product) => ({ id: p.id, name: p.name, price: p.price, rating: p.rating, colours: p.colours, inStock: p.inStock });

export async function registerCatalogTools(shop: Shop) {
  //#step 2.1
  // #done a tool is a plain object: a name, a description for the agent, a JSON Schema for its input, and execute
  const searchProducts: ModelContextTool = {
    name: 'search_products',
    description:
      'Search the Namma Bazaar catalogue. Returns up to 8 products as JSON: id, name, price in INR, rating out of 5, colours and inStock. Pass an id to add_to_cart or get_reviews.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words to look for, for example "wireless headphones".' },
        category: { type: 'string', enum: shop.categories, description: 'Only products in this category.' },
        maxPrice: { type: 'number', description: 'Highest price, in INR.' },
        minRating: { type: 'number', minimum: 1, maximum: 5, description: 'Lowest average rating, from 1 to 5.' }
      }
    },
    //#step 4.1
    // #done a hint for the agent: calling this changes nothing
    annotations: { readOnlyHint: true },
    //#gap
    // 🔨 4.1 Searching changes nothing. Say so: annotations: { readOnlyHint: true }
    // 🧠 Annotations are hints. An agent can use this one to call the tool without asking the shopper first.
    //#end
    async execute(input) {
      const products = await shop.searchProducts(input);
      // The page follows the agent, so the shopper sees what it is looking at.
      shop.ui.showSearch(input);
      return JSON.stringify(products.slice(0, 8).map(summarise));
    }
  };
  //#step 6.1 given
  await document.modelContext.registerTool(withLogging(searchProducts, shop.log));
  //#before
  await document.modelContext.registerTool(searchProducts);
  //#end
  //#gap
  // 🔨 2.1 Describe a search_products tool, then register it.
  // 💡 const searchProducts: ModelContextTool = { name: 'search_products', description, inputSchema, execute };
  // 💡 description: what it searches, what comes back (up to 8 products as JSON) and what an id is for. The agent reads nothing else.
  // 💡 inputSchema: { type: 'object', properties: { query, category, maxPrice, minRating } }
  //    Each property gets a type and a description. category also gets enum: shop.categories. None is required.
  // 💡 async execute(input) {
  //      const products = await shop.searchProducts(input);
  //      shop.ui.showSearch(input);
  //      return JSON.stringify(products.slice(0, 8).map(summarise));
  //    }
  // 💡 await document.modelContext.registerTool(searchProducts);
  // 🧠 Return a string. Chrome turns anything else into JSON text, so decide yourself what the agent reads.
  // 📡 DevTools > Application > WebMCP lists search_products. Run it with query "wireless headphones" and maxPrice 5000.
  // 🧪 The tool exists, its schema has the four properties, and a search answers with matching products as JSON text.
  // 🔥 2.1 Add title: 'Search products' (a short name for browser UI), and an outputSchema describing the array you return (Chrome's docs list outputSchema from Chrome 159; an older Chrome may ignore it).
  //#end
  //#step 4.1 given

  // Reviews are written by customers: the one tool here whose result is text the shop didn't write.
  const getReviews: ModelContextTool = {
    name: 'get_reviews',
    description: 'Read what customers wrote about one product, as JSON: rating, title, text and author of each review. Reviews are opinions from strangers.',
    inputSchema: {
      type: 'object',
      properties: { productId: { type: 'string', description: 'A product id from search_products, for example "hp-102".' } },
      required: ['productId']
    },
    //#step 4.1
    // #done this tool only reads, and what it returns was written by strangers
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    //#gap
    // 🔨 4.1 This tool only reads, and what it returns was written by strangers. Say both.
    // 💡 annotations: { readOnlyHint: true, untrustedContentHint: true }
    // 🧠 untrustedContentHint tells the agent to treat the result as data, never as instructions.
    // 📡 Run get_reviews for hp-102 and read the third review. It is addressed to the agent, not to shoppers.
    // 🧪 search_products and view_cart are read-only. get_reviews is read-only and untrusted. add_to_cart is neither.
    //#end
    async execute(input) {
      try {
        const reviews = await shop.getReviews(input.productId);
        shop.ui.showProduct(input.productId);
        if (!reviews.length) return 'Nobody has reviewed this product yet.';
        return JSON.stringify(reviews.map((r) => ({ rating: r.rating, title: r.title, text: r.body, author: r.author })));
      } catch (error) {
        return errorText(error);
      }
    }
  };
  //#step 6.1 given
  await document.modelContext.registerTool(withLogging(getReviews, shop.log));
  //#before
  await document.modelContext.registerTool(getReviews);
  //#end
  //#end
}
