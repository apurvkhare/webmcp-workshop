/**
 * Tools for looking around the catalogue.
 */
import type { Product, Shop } from '@shop';

/** What an agent needs to choose a product and take the next step. Not the whole record: tool results should stay small. */
const summarise = (p: Product) => ({ id: p.id, name: p.name, price: p.price, rating: p.rating, colours: p.colours, inStock: p.inStock });

export async function registerCatalogTools(shop: Shop) {
  // ✅ 2.1 a tool is a plain object: a name, a description for the agent, a JSON Schema for its input, and execute
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
    async execute(input) {
      const products = await shop.searchProducts(input);
      // The page follows the agent, so the shopper sees what it is looking at.
      shop.ui.showSearch(input);
      return JSON.stringify(products.slice(0, 8).map(summarise));
    }
  };
  await document.modelContext.registerTool(searchProducts);
}
