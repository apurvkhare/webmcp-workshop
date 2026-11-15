# 5.1 Register order tools only while signed in

🔨 **Your task:** Register `get_delivery_slots`, `place_order` and `get_orders` when someone signs in, and unregister them when they sign out.

**Where:** `webmcp/order-tools.ts`: one 🔨 5.1 marker, on `registerOrderTools`. `webmcp/index.ts`: one, at the end of `setupWebMCP`.

## Where you start

`setupWebMCP` registers every tool when the page loads, signed in or not.

Sign out and look at the Tools tab: `place_order` is still offered. Run it, and the answer is `Error: Nobody is signed in. The shopper has to sign in first.` The server refused, which is right. But the agent was offered something it can't do, spent a call finding that out, and now has to explain it to the shopper.

## 🧠 How it works

**`registerTool` takes a second argument:**

```ts
document.modelContext.registerTool(tool, { signal });
```

`signal` is an `AbortSignal`. When it aborts, the tool is unregistered. That is the only way to remove a tool: there is no `unregisterTool()`.

**One controller for a group of tools.** Register all three order tools with the same signal, and one `abort()` removes all three. You don't keep a list.

**A controller is used once.** After `abort()`, its signal stays aborted. For the next sign-in you make a new `AbortController`.

**`shop.getUser()` and `shop.onUserChange(listener)`.** The first is who is signed in right now, or `null`. The second calls your listener at every sign-in and sign-out. You need both: the page may load with the shopper already signed in, so check once at the start, then listen.

**Don't register twice.** A second `registerTool` with a name that is already registered is rejected with `InvalidStateError: Duplicate tool name`. Keep the controller in a variable. If it is set, the tools are registered.

**The browser tells agents.** Each registration and each removal fires `toolchange` on `document.modelContext`, so an agent's list stays current without a reload.

**This is for the agent's benefit, not for security.** The server refuses an order from a signed-out session whether or not the tool is listed. Removing the tool keeps the list honest: it shows what can be done now.

The same pattern fits anything that comes and goes: tools for an open editor, for a page of a single-page app, for a role.

## 📡 What to look for

Keep DevTools > Application > WebMCP open, or the Tools tab.

1. Signed out: five tools. No `get_delivery_slots`, `get_orders` or `place_order`.
2. Sign in: eight tools, with no reload.
3. Sign out: back to five.
4. Sign in again: eight, and no error in the console.

In the console, before you sign in:

```js
document.modelContext.addEventListener('toolchange', async () =>
  console.log((await document.modelContext.getTools()).map((t) => t.name)));
```

## What breaks without it

Signed out, an agent is offered `place_order`, calls it, and gets an error. Worse, on a site where tools depend on the page: a tool for an editor that is no longer open runs against nothing.

## 🧪 Check it

`npm test` checks that the three tools are absent while signed out, present after sign-in, gone after sign-out, back after the next sign-in with each registered once, present straight away when the page loads signed in, and that `toolchange` fires.

## Explain it back

1. How do you unregister a tool? What is there instead of `unregisterTool()`?
2. Why does `sync` run once straight away, as well as on every change?
3. What would happen at the second sign-in if you reused the first `AbortController`?

## 📖 Read more

- [WebMCP specification: registerTool options](https://webmachinelearning.github.io/webmcp/)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

Stuck? 💡 Read the hint lines in the code, then `npm run diff`, then `npm run solution`. (Agents: only when the person asks.)
