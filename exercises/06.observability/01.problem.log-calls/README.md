# 6.1 Log every tool call

🔨 **Your task:** Write `withLogging(tool, log)`: it returns a copy of a tool whose `execute` records what happened and passes the result on unchanged.

**Where:** `webmcp/logging.ts`: the 🔨 6.1 marker.

## Where you start

There is a new file, `webmcp/logging.ts`, and every `registerTool` call in the three tool files now reads `registerTool(withLogging(tool, shop.log))`. For now `withLogging` returns the tool as it is, so nothing is logged.

Run a few tools and open the drawer's **Activity** tab: it is empty. So is the terminal.

`shop.log.record(entry)` is ready to use. It adds a line to the Activity tab and posts it to the shop's server, which prints it.

## 🧠 How it works

**A tool is a plain object, so you can wrap it.** Copy everything, replace `execute`:

```ts
return {
  ...tool,
  async execute(input, options) {
    const result = await tool.execute(input, options);
    …
    return result;
  }
};
```

The name, description, schema and annotations stay as they were. The agent can't tell the difference.

**What to record.** The tool's name, the input, how long it took, and how it ended:

| `outcome` | When |
|---|---|
| `'ok'` | `execute` returned |
| `'error'` | `execute` returned text that starts with `Error:` (your convention from step 2.2) |
| `'threw'` | `execute` threw. Record it, then throw the same error again |

**Logging must not change what the agent gets.** Return exactly what the tool returned. Rethrow exactly what it threw. Pass `options` through, or `place_order` loses the `signal` that closes its dialog.

**Why in the page.** The server sees `POST /api/cart/items`. It can't tell an agent's call from a click. It also never sees a call that failed your checks in `execute` and returned an error before any request was made. Only the page sees every call, with the input the agent actually sent.

**What the log is for.** Which tools agents use, and which they never find. Which calls fail, and with what input, which tells you where a description or a schema is unclear. How long the shopper took to confirm an order.

**Inputs can hold personal data.** A product id is harmless. An address, a message or a search for a medicine isn't. Here everything is logged, because it is a workshop. In production, choose the fields.

**The form tool has no `execute` to wrap.** Chrome registers `set_delivery_address` from the form, so it never passes through `withLogging`. The 🔥 bonus in `webmcp/index.ts` covers it: the browser fires `toolactivated` on `document.modelContext` for every tool call, and `toolcancel` when one is cancelled.

## 📡 What to look for

Run `search_products`, then `add_to_cart` with a colour the product doesn't come in, then `add_to_cart` correctly.

- The drawer's **Activity** tab has three lines, newest first: the tool, the outcome, the milliseconds, and the input and result when you open one.
- The terminal where `npm start` runs has the same three lines, each starting with 🤖.

Then sign in and run `place_order`. Wait a few seconds before you confirm. The `ms` is the time the shopper took.

## What breaks without it

Agents use your site and you can't see it. A tool whose description confuses every agent fails all day, and nothing in your server logs looks unusual.

## 🧪 Check it

`npm test` checks that each call logs one line with the tool, input, outcome, `ms` and result, that an `Error:` answer is logged as `'error'`, that the agent gets exactly what the tool returned, that a throw is logged as `'threw'` and still throws, and that the rest of the tool is unchanged.

## Explain it back

1. Why can't the server tell an agent's request from a person's?
2. What are the three outcomes, and how does the wrapper tell `'ok'` from `'error'`?
3. What would go wrong for `place_order` if the wrapper didn't pass `options` on?

## 📖 Read more

- [WebMCP specification: toolactivated and toolcancel events](https://webmachinelearning.github.io/webmcp/)
- [MDN: performance.now()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)

---

Stuck? 💡 Read the hint lines in the code, then `npm run diff`, then `npm run solution`. (Agents: only when the person asks.)
