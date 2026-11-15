# ✅ 3.1 Make the address form a tool

This folder is the finished step. Every ✅ comment in the code marks work from this step or an earlier one.

**What was built:** The delivery address form is a tool named `set_delivery_address`. The form has `toolname` and `tooldescription`, the phone and PIN code fields have `toolparamdescription`, and the submit handler answers an agent with `respondWith()`.

**Where:** `ui/AddressForm.tsx`: the 3.1 changes on the `<form>`, its submit handler, and two inputs.

**📡 What to look for:** On the checkout page, the WebMCP pane or the Tools tab lists `set_delivery_address` with a schema Chrome built from the fields. Run it: the fields fill in, the form is outlined, and the call waits until you press Save.

## Explain it back

1. Where does `set_delivery_address`'s input schema come from? Name three things in the form that end up in it.
2. Who submits the form when an agent calls the tool, and what would `toolautosubmit` change?
3. Why does this form need `respondWith()`, when a form that navigates to a new page doesn't?

**Next:** section 4, `npm run go 4.1`
