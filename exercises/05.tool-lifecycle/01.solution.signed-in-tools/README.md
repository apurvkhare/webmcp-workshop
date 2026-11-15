# ✅ 5.1 Register order tools only while signed in

This folder is the finished step. Every ✅ comment in the code marks work from this step or an earlier one.

**What was built:** `get_delivery_slots`, `place_order` and `get_orders` are registered at sign-in with one `AbortSignal`, and unregistered at sign-out by aborting it.

**Where:** `webmcp/order-tools.ts`: `registerOrderTools` takes `options` and passes it to `registerTool`. `webmcp/index.ts`: the 5.1 change at the end of `setupWebMCP`.

**📡 What to look for:** Keep the WebMCP pane or the Tools tab open and sign in and out. The list goes from five tools to eight and back, with no reload.

## Explain it back

1. How do you unregister a tool? What is there instead of `unregisterTool()`?
2. Why does `sync` run once straight away, as well as on every change?
3. What would happen at the second sign-in if you reused the first `AbortController`?

**Next:** section 6, `npm run go 6.1`
