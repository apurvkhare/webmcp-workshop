# ✅ 2.1 Register search_products with a JSON Schema

This folder is the finished step. Every ✅ comment in the code marks work from this step or an earlier one.

**What was built:** A `search_products` tool, described and registered with `document.modelContext.registerTool()`.

**Where:** `webmcp/catalog-tools.ts`: the 2.1 change, inside `registerCatalogTools`.

**📡 What to look for:** DevTools > Application > WebMCP, or the drawer's Tools tab, lists `search_products` with its description and schema. Run it with `{ "query": "wireless headphones", "maxPrice": 5000, "minRating": 4 }`: four products come back as JSON, and the page moves to the search results.

## Explain it back

1. Where does `execute` run, and whose session does its `fetch` use?
2. What does the agent know about `search_products` before it calls it?
3. Why return eight short summaries instead of the full product records?

**Next:** `npm run go 2.2`
