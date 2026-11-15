# 2 Register tools

A WebMCP tool is a JavaScript function your page hands to the browser, with a name, a description and a JSON Schema for its input. An agent in the browser sees the list and calls them. You write two.

| Step | You write | Where |
|---|---|---|
| 2.1 | `search_products`: name, description, `inputSchema`, `execute`, then `registerTool()` | `webmcp/catalog-tools.ts` |
| 2.2 | `add_to_cart`: `required` in the schema, input checks, errors returned as text | `webmcp/cart-tools.ts` |

By the end, an agent can find a product and put it in the cart without reading a single page.

```
 agent ── getTools() ──────────────▶ browser ── the page's registered tools
 agent ── executeTool(tool, input) ─▶ browser ── execute(input) in your page ──▶ fetch('/api/…') with the shopper's cookie
```

The tool runs in the tab, as the shopper. It calls the same `shop` functions the buttons call, so there is no second backend and no new auth.

Start with `npm run go 2.1`, and keep `npm start` running in another terminal.
