# 3 Turn a form into a tool

You already have forms. Each one is a list of named, typed, labelled inputs with a submit action, which is most of a tool definition. In Chrome, two attributes on the `<form>` make it one, with no `registerTool()` call.

| Step | You write | Where |
|---|---|---|
| 3.1 | `toolname` and `tooldescription` on the form, `toolparamdescription` on two fields, and `respondWith()` in the submit handler | `ui/AddressForm.tsx` |

By the end, an agent can fill in the delivery address on the checkout page. The shopper still presses Save.

```
 agent ── executeTool(set_delivery_address, { … }) ─▶ Chrome fills the fields
                                                       shopper presses Save
 agent ◀── "Saved the delivery address: …" ────────── respondWith(result)
```

> **This part is Chrome-only, and it is no longer in the WebMCP specification.** The declarative API was taken out of the spec draft on 8 October 2026 while its design is reworked. Chrome still ships it behind the same flag and origin trial. It is here because it shows the idea well and works today. Don't build a product on it yet: the imperative API from section 2 is the stable part.

Start with `npm run go 3.1`.
