/**
 * Tools for looking around the catalogue.
 */
import { errorText, type Product, type Shop } from '@shop';

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
    // ✅ 4.1 a hint for the agent: calling this changes nothing
    annotations: { readOnlyHint: true },
    async execute(input) {
      const products = await shop.searchProducts(input);
      // The page follows the agent, so the shopper sees what it is looking at.
      shop.ui.showSearch(input);
      return JSON.stringify(products.slice(0, 8).map(summarise));
    }
  };
  await document.modelContext.registerTool(searchProducts);

  // Reviews are written by customers: the one tool here whose result is text the shop didn't write.
  const getReviews: ModelContextTool = {
    name: 'get_reviews',
    description: 'Read what customers wrote about one product, as JSON: rating, title, text and author of each review. Reviews are opinions from strangers.',
    inputSchema: {
      type: 'object',
      properties: { productId: { type: 'string', description: 'A product id from search_products, for example "hp-102".' } },
      required: ['productId']
    },
    // ✅ 4.1 this tool only reads, and what it returns was written by strangers
    annotations: { readOnlyHint: true, untrustedContentHint: true },
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
  await document.modelContext.registerTool(getReviews);
}
