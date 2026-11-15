# 2.1 Register search_products with a JSON Schema

🔨 **Your task:** Describe a `search_products` tool and register it with `document.modelContext.registerTool()`.

**Where:** `webmcp/catalog-tools.ts`: the 🔨 2.1 marker, inside `registerCatalogTools`.

## Where you start

Namma Bazaar is a working shop: search, product pages, a cart, checkout. Open it at <http://localhost:5173> and click around.

`webmcp/index.ts` has `setupWebMCP(shop)`, which the shop calls once when the page has loaded. It calls `registerCatalogTools(shop)`, and that function is empty. The page offers an agent nothing: the drawer's **Tools** tab says so.

`shop` is the page's own API, the one the buttons use: `shop.searchProducts(filters)` fetches from the server, and `shop.ui.showSearch(filters)` navigates the page to the results.

## 🧠 How it works

**A tool is a plain object.** Four fields matter:

```ts
const searchProducts: ModelContextTool = {
  name: 'search_products',
  description: '…',
  inputSchema: { type: 'object', properties: { … } },
  async execute(input) { … }
};
await document.modelContext.registerTool(searchProducts);
```

**`name`** is how the agent refers to the tool. Up to 128 characters: letters, digits, `_`, `-` and `.`. Chrome rejects anything else, and a name that is already registered.

**`description`** is the only documentation the agent gets. Say what the tool does, what comes back, and what to do with it next ("pass an id to add_to_cart"). Chrome rejects an empty one.

**`inputSchema`** is a JSON Schema for one object. Give every property a `type` and a `description`. `enum` lists the allowed values, which here are the shop's categories.

**`execute(input)`** runs in the page, in the shopper's tab, with their session. It calls `shop.searchProducts(input)`, which is an ordinary `fetch` with the shopper's cookie. Nothing new is exposed: the tool can do what the shopper can already do by clicking.

**Return a string.** That string is what the agent reads. Chrome turns an object into JSON text for you, and `undefined` into the word "undefined", so decide yourself. Keep it small: eight products with six fields each, not the whole catalogue.

**The page follows the agent.** `shop.ui.showSearch(input)` moves the page to the same results, so the shopper sees what the agent is looking at.

**`registerTool()` returns a promise.** It rejects if the name is invalid or already taken, or the description is empty.

## 📡 What to look for

Open DevTools > **Application** > **WebMCP**, or the drawer's **Tools** tab. `search_products` is listed with its description and schema.

Run it with:

```json
{ "query": "wireless headphones", "maxPrice": 5000, "minRating": 4 }
```

Four products come back as JSON, and the page behind the drawer moves to the search results.

In the console, this is what an agent does:

```js
const [tool] = await document.modelContext.getTools();
await document.modelContext.executeTool(tool, { query: 'keyboard' });
```

## What breaks without it

Without a tool, an agent has to read the page, find the search box, type, wait, and read the page again. You'll see that in section 1's replay. Without a schema, it has to guess what to send. Without a description, it doesn't know the tool is worth calling.

## 🧪 Check it

`npm test` checks that the tool is registered, that its schema has the four properties with descriptions, and that a search answers with the matching products as JSON text.

## Explain it back

Answer these in your own words, or have your agent answer them, quoting the lines it wrote.

1. Where does `execute` run, and whose session does its `fetch` use?
2. What does the agent know about `search_products` before it calls it?
3. Why return eight short summaries instead of the full product records?

## 📖 Read more

- [WebMCP specification: registerTool](https://webmachinelearning.github.io/webmcp/)
- [Chrome for Developers: WebMCP](https://developer.chrome.com/docs/ai/webmcp)

---

Stuck? 💡 Read the hint lines in the code, then `npm run diff`, then `npm run solution`. (Agents: only when the person asks.)
