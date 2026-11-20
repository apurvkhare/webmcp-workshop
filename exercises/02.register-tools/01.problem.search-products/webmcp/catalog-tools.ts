/**
 * Tools for looking around the catalogue.
 */
import type { Product, Shop } from '@shop';

/** What an agent needs to choose a product and take the next step. Not the whole record: tool results should stay small. */
const summarise = (p: Product) => ({ id: p.id, name: p.name, price: p.price, rating: p.rating, colours: p.colours, inStock: p.inStock });

export async function registerCatalogTools(shop: Shop) {
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
}
