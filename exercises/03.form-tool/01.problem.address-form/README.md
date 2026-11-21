# 3.1 Make the address form a tool

🔨 **Your task:** Turn the delivery address form into a tool named `set_delivery_address`: name and describe the form, describe two of its fields, and give the agent an answer when it submits.

**Where:** `ui/AddressForm.tsx`: four 🔨 3.1 markers. Two on the `<form>` and its submit handler, two on the phone and PIN code inputs.

## Where you start

Sign in (the **Sign in** link, then one click: the demo shopper has no password), add something to the cart, and go to checkout. The first step is the address form in `ui/AddressForm.tsx`: six fields, a **Save and continue** button, and an `onSubmit` that calls `save(form)`.

`save()` already returns a promise for one sentence: `Saved the delivery address: …`, or `Error: …` when the server refuses the address. Nothing uses that sentence yet.

An agent has no tool for the address. Check the Tools tab while you are on the checkout page.

## 🧠 How it works

**`toolname` and `tooldescription` on a `<form>` register it as a tool.** Chrome does the registering. The tool exists while the form is in the page and goes away when the form does, so `set_delivery_address` is only offered on the checkout page.

**Chrome builds the input schema from the fields.** Each field's `name` becomes a property. `required` puts it in the schema's `required` list. A `<select>` becomes an `enum` of its option values. The property's `description` is the field's `<label>` text.

**`toolparamdescription` replaces the label as the description.** "Mobile number" is enough for a person, who can see the placeholder and the error message. An agent needs the format: ten digits, no country code.

**The agent fills, the shopper submits.** When an agent calls the tool, Chrome puts the values in the fields, focuses the submit button and waits. The call finishes only when the shopper presses Save. That is the confirmation step, and you get it for free. `toolautosubmit` on the form removes it: Chrome submits by itself. Use that only for forms where a wrong submit costs nothing, such as a search box.

**The agent needs an answer.** A form submit normally ends in a navigation, and Chrome gives the agent the page that results. This shop is a single-page app: `onSubmit` calls `preventDefault()` and saves with `fetch`. So you tell Chrome what the answer is:

```ts
const submit = event.nativeEvent as SubmitEvent;
if (submit.agentInvoked) submit.respondWith(result);
```

`agentInvoked` is `true` when an agent filled the form. `respondWith()` takes a promise for the tool's result. It only works after `preventDefault()`.

**`event.nativeEvent`** is the browser's own `SubmitEvent`. React wraps events, and the wrapper doesn't have these two members.

**In React, the attributes are written as they are in HTML**, all lowercase: `toolname`, not `toolName`. `shop/src/react-webmcp.d.ts` adds them to the JSX types so TypeScript accepts them.

## 📡 What to look for

On the checkout page, open DevTools > Application > WebMCP, or the Tools tab. `set_delivery_address` is listed. Look at its schema: you didn't write it. Find `phone`'s description, the `enum` for `addressType`, and the `required` list.

Run it:

```json
{ "fullName": "Apurv Khare", "phone": "9845011111", "line1": "221, 12th Main, Koramangala", "city": "Bengaluru", "pincode": "560034", "addressType": "work" }
```

The fields fill in and the form is outlined: the shop's CSS styles `form:tool-form-active`. The Save button is focused and highlighted, and the call is still running. Press **Save and continue**, and the answer arrives: "Saved the delivery address: …".

Run it again with `"line1": "221"`. The browser's form validation accepts that, and the shop's server doesn't. After you press the button, the agent gets `Error: The address isn't complete: …`.

## What breaks without it

Without `toolname`, the agent has to find six inputs on the page and type into each one. Without `respondWith()`, the address is saved but the agent is never told, and its call ends without a result.

## 🧪 Check it

`npm test` checks the attributes on the form and the two fields, that an agent's submit is answered with the "Saved the delivery address…" sentence, that a refused address is answered with `Error: …`, and that a person's submit never calls `respondWith()`.

The tests can't check what Chrome does with the attributes. `npm run verify:chrome -- --only 3.1` does that against the solution, in a real Chrome.

## Explain it back

1. Where does `set_delivery_address`'s input schema come from? Name three things in the form that end up in it.
2. Who submits the form when an agent calls the tool, and what would `toolautosubmit` change?
3. Why does this form need `respondWith()`, when a form that navigates to a new page doesn't?

## 📖 Read more

- [Chrome for Developers: WebMCP declarative API](https://developer.chrome.com/docs/ai/webmcp)
- [The spec change that removed it, for now](https://github.com/webmachinelearning/webmcp/pull/338)

---

Stuck? 💡 Read the hint lines in the code, then `npm run diff`, then `npm run solution`. (Agents: only when the person asks.)
