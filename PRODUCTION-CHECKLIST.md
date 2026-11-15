# Production checklist

Before you put WebMCP tools on a real site. Each line is one thing to check and why. The examples are from Namma Bazaar's finished code in `app/webmcp/`.

## Tool design

- [ ] **Names are short and say what the tool does**, like `search_products` or `place_order`. Chrome accepts 1 to 128 letters, digits, `_`, `-` and `.`, and rejects anything else with "Invalid tool name".
- [ ] **Each description says what the tool does, when to use it and what it returns.** It is the agent's only guide: it can't see your page.
- [ ] **Descriptions point to the next tool**, like "Pass an id to add_to_cart". The agent learns the order of calls from them.
- [ ] **Results are small:** only the fields the agent needs for its next step (`search_products` returns six fields of at most 8 products). Every result goes into the agent's context.
- [ ] **You stay within Chrome's recommended budgets:** 30 characters per tool or parameter name, 150 per parameter description, 500 per tool description, 1,500 per tool result. They aren't enforced; they're what Chrome's docs recommend.
- [ ] **Results are strings.** Chrome turns a returned object into JSON text and `undefined` into the text "undefined". The agent only ever gets text.
- [ ] **The page registers only the tools it needs.** There is no limit on the number of tools, but each one takes space in the agent's context.

## Input and errors

- [ ] **`execute` checks every input itself.** Chrome does not validate input against `inputSchema`: missing required fields and wrong types reach `execute` unchanged.
- [ ] **The schema still says exactly what to send** (`required`, `enum`, `minimum`, descriptions with an example). It's how the agent gets the call right the first time.
- [ ] **Errors are returned as text, not thrown.** If `execute` throws, the agent gets a generic "the invocation failed" and never sees your message.
- [ ] **Each error says how to fix the call,** like "Tarang Studio Pro Wireless Headphones comes in black, silver. Pass one of those as colour." The agent can then correct itself.
- [ ] **Errors you return start the same way** (`Error:` here), so your logs can count them.

## Auth and session

- [ ] **The server authorises every request,** whether a person or an agent made it. Tools run in the page, as the signed-in user, with the session they already have.
- [ ] **Nothing is trusted more because an agent sent it.** A tool call is one more client of your API, and its input is untrusted input.
- [ ] **Anything that spends money or can't be undone is worked out again on the server** from the current state, not from what the agent remembers (`place_order` previews the order from the cart as it is now).
- [ ] **Hiding a tool is not access control.** Unregistering `place_order` on sign-out is for the agent's benefit; the server still refuses a signed-out order.

## User control

- [ ] **Annotations are set honestly:** `readOnlyHint` only on tools that change nothing, `untrustedContentHint` on results with other people's text, `consequentialHint` on anything that matters and is hard to undo.
- [ ] **You don't rely on annotations to protect anyone.** They are hints to the agent. Chrome shows no confirmation of its own for `consequentialHint` today, and a malicious page can set any hints it likes.
- [ ] **Consequential tools ask the person in your own UI,** for example a dialog inside `execute` that waits for a click. `requestUserInteraction()` is no longer in the spec or in Chrome.
- [ ] **The confirmation shows what will actually happen** (items, address, slot, total from the server), not what the agent asked for.
- [ ] **The confirmation closes when the call is cancelled:** pass the `signal` that `execute` receives.
- [ ] **A decline returns a clear sentence** that tells the agent nothing happened and not to retry on its own.
- [ ] **Form tools have no `toolautosubmit` where the person should check first.** Without it, Chrome fills the form and waits for the person to press submit; the form needs a submit button.

## Untrusted content

- [ ] **Every tool that returns text your site didn't write has `untrustedContentHint`:** reviews, comments, questions, messages, profile fields.
- [ ] **Read tools don't include strangers' text they don't need.** `search_products` returns ratings, not review text.
- [ ] **You have tested with a planted instruction** (like the "ignore your instructions" review on `hp-102`) and know what your confirmation step shows when an agent follows it.

## Lifecycle

- [ ] **You feature-detect:** `if (!('modelContext' in document)) return;`. Without the flag or a trial token, there is no `modelContext`.
- [ ] **Every tool that depends on state is registered with a `signal`,** and you abort it when the state changes. There is no `unregisterTool()`.
- [ ] **Tools are registered once.** A second tool with the same name rejects with "Duplicate tool name", so abort the old controller before you register again.
- [ ] **The tool list matches what the page can do right now** (order tools only while signed in). `toolchange` tells agents when it changes.
- [ ] **You `await` or catch `registerTool()`.** It returns a promise that rejects on a bad name, a duplicate or an empty description.

## Observability

- [ ] **Every call is logged in the page:** tool, input, duration and outcome (ok, error or threw), with a wrapper like `withLogging()`.
- [ ] **The wrapper changes nothing:** it passes `options` (and the `signal`) through and throws again what it caught.
- [ ] **You decide what personal data goes into logs.** Inputs and results can hold names, phone numbers and addresses. Keep only what you need, for as long as you need it.

## Rollout

- [ ] **Production pages carry an origin trial token** (a `<meta http-equiv="origin-trial">` tag or an `Origin-Trial` header). The flag only works on your own browser.
- [ ] **You know when the trial ends:** it was extended to Chrome 162. There is no ship milestone yet. Put the end date from the trial console in your calendar.
- [ ] **It is Chrome only today.** Edge has an implementation in testing; WebKit opposes WebMCP and Mozilla is neutral.
- [ ] **The site works the same without WebMCP.** Every tool does something a person can also do in the UI.
- [ ] **You know the declarative API (`toolname` on forms) is not in the spec** since October 2026. Chrome still supports it; it may change.
- [ ] **You re-read the spec and Chrome's docs before each release.** This year the API moved from `navigator` to `document`, `executeTool()` switched from JSON strings to objects in Chrome 155, and `requestUserInteraction()` was removed.

## Testing

- [ ] **Unit tests run against a small fake `document.modelContext`,** like the double in `shop/src/testing`, so they run offline and fast.
- [ ] **Real Chrome tests run with WebMCP on** (`--enable-features=WebMCP`), calling `getTools()` and `executeTool()` (this repo: `npm run verify:chrome`).
- [ ] **Tests cover the bad inputs** Chrome lets through: missing fields, wrong types, unknown ids.
- [ ] **Each tool has been run by hand** from DevTools › Application › WebMCP.
- [ ] **At least one agent has done a real task end to end,** for example through Chrome DevTools MCP with `--categoryExperimentalWebmcp`, or the Model Context Tool Inspector extension.

> **Status on 15 Nov 2026: what could change**
>
> - The origin trial runs to Chrome 162. Chrome has no ship milestone yet.
> - Chrome may start checking input against `inputSchema` (its own source says it "will likely be" enforced). Keep your checks anyway.
> - A way for a tool to ask the user (once `requestUserInteraction()`) is listed as future work.
> - The declarative API is Chrome only; it may come back to the spec in another form, or go.
> - Chrome passes a returned string to the agent as it is; the spec appears to JSON-serialise every result. Return strings and check this again.
> - Whether Gemini in Chrome calls WebMCP tools, and whether it asks the user for `consequentialHint`, isn't documented yet.
> - Chrome's character budgets are recommendations; limits are listed as future work.
