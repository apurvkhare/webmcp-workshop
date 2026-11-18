---
title: Hands-on WebMCP
info: |
  GDG Cloud Bengaluru DevFest. Hands-on workshop, 90-minute slot, content planned for 75 minutes.
  Expose your web app to AI agents: Namma Bazaar, agent-ready in seven steps.
---

# Hands-on WebMCP

Expose your web app to AI agents

GDG Cloud Bengaluru DevFest · 90 minutes · Namma Bazaar, in ₹

<!--
0:00, 4 min with the next slide. Put this up while people sit down.
Say: "Laptops open, terminal open, repo cloned. In fifteen minutes you'll write your first tool."
The slot is 90 minutes; the content is 75. The last 15 are questions and buffer, so a late start doesn't cost the ending.
-->

---

# Setup check (0:00, 4 min)

```bash
npm run doctor
npm start -- --app app
```

- Open http://localhost:5173 in the latest Chrome, 155 or later
- The drawer on the right says **5 tools**, not **WebMCP off**

<!--
0:00, 4 min.
Say: "Two commands. Doctor checks your laptop. npm start with --app app serves the finished shop on port 5173. You'll switch to your own playground when we start coding."
What to look for: the workshop drawer on the right of the shop shows a tool count in its header. The finished shop registers five tools while signed out, so it says "5 tools". If it says "WebMCP off", the flag isn't on.
If it says "WebMCP off":
1. Ask everyone to update Chrome first: chrome://settings/help, then Relaunch. chrome://version must say 155 or later; the workshop was checked in 157.
2. chrome://flags/#enable-webmcp-testing, set it to Enabled, and #devtools-webmcp-support too if it is listed. Relaunch Chrome.
3. Flag not in the list at all, on 155 or later? Try chrome://flags/#enable-experimental-web-platform-features, which also turns WebMCP on. Or quit Chrome and start it from the terminal with --enable-features=WebMCP,DevToolsWebMCPSupport.
4. Port 5173 taken? npm start -- --port 5174.
Anyone still stuck after two minutes: pair them with a neighbour and fix it during the demo. The demo needs no laptop.
No API key is needed for any step.
-->

---

# 1 · An agent goes shopping (0:04, 10 min)

> Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot.

<!--
0:04, 10 min. Demo, no code. The runbook is demo/README.md: follow it, including the timing plan.
Read the task out. Ask: "How many clicks would that take you?"
Say: "You're about to see one agent do this twice, on the same page, with the same prompt. The only thing that changes is what it's given."
Have ready before you start: the finished shop on port 5174, Chrome on the demo profile signed in as Asha with ?drawer=off, DevTools docked at the bottom on Application > WebMCP, and a terminal with the first agent command typed.
The answer, so you can check it live: hp-102, Tarang Studio Pro, ₹4,799, rated 4.6. hp-103 is rated 4.7 but comes in blue and red only. Total with DEVFEST10: ₹4,319. First order after a reset: NB-1001.
-->

---

# Without WebMCP, then with it

- Same Chrome tab, same prompt, same agent
- Run 1: Chrome DevTools MCP, page tools only
- Run 2: the same, plus `--categoryExperimentalWebmcp`
- Watch: what the agent reads, how many steps, who confirms the order

<!--
0:05. Switch to the terminal for run 1. Narrate as it goes:
"It takes a snapshot: the whole page as an accessibility tree. It clicks one element. The page changed, so it takes another snapshot."
"The product cards don't show colours, so it has to open products one by one to find black."
"The coupon field is behind 'Have a coupon?'. Checkout is three screens."
"Nobody asked you before the order was placed. The agent pressed the button. To the page, its click is your click."
Hard stop at 0:09, finished or not. Reset (curl -X POST http://localhost:5174/api/dev/reset), sign in again, start the second agent.
Run 2, from about 0:09:30:
"It reads a tool list, not a page. Eight tools while signed in."
"search_products does the query, the price and the rating in one call. The colours come back with the results, so it never opens a product page."
"place_order opens a dialog in the page, and the agent waits. Read it with me." Pause. Click Place order · ₹4,319.
Point at the DevTools WebMCP pane: every call, with its input and output.
If the agent reads reviews and follows the planted one, click Not now and say "Hold that thought: section 4."
-->

---

# On your laptop: Agent view

- Drawer › **Agent view** › **Shop by clicking** and **Shop with tools**
- Same task, done by a script
- Counts steps and how much text the agent had to read
- A script, not a model. Not a benchmark

<!--
0:12:30, about 1.5 min.
Say: "You can see the same thing on your own laptop, with no model and no key. The Agent view tab in the drawer shows what an agent has to read on the current page, next to the tool list, with sizes. The two buttons replay the task: one script clicks through the UI the way a UI-driving agent would, the other calls the tools."
Say it plainly, every time: "It's a script, not a model, and it's not a benchmark. The click script already knows the shortest path and never misclicks, so it's the UI's best case. It shows the shape of the two approaches, nothing more."
You are running the finished shop from the setup check, so both buttons work now. Press Shop by clicking, then Shop with tools, and confirm the order when the dialog asks. In section 7 you'll press Shop with tools again, on your own code.
If anyone asks for numbers: the Chrome team has published no comparison. Figures you see online come from vendors' own tests. I'm not putting any on a slide.
Fallback if the network died during the demo: play the dry-run recording, or press the two replay buttons on my screen (?drawer=on).
-->

---

# MCP and WebMCP (0:14, 6 min)

| | MCP | WebMCP |
|---|---|---|
| Where tools run | A server process | The page's JavaScript, in the user's tab |
| Transport | JSON-RPC over stdio or Streamable HTTP | A browser API, `document.modelContext` |
| Client | The AI host app | The browser's agent, extensions, DevTools |
| Discovery | `tools/list` | By visiting the page |
| Auth | OAuth 2.1 | The session the user already has |
| Primitives | Tools, resources, prompts, elicitation | Tools only, with annotations |
| Lifecycle | Long-running, works headless | Only while the tab is open, with the user there |
| Maturity | Multi-vendor | Chrome origin trial to M162, Edge testing; WebKit opposes, Mozilla neutral |

<!--
0:14, 6 min for this and the next two slides.
Walk the rows, one sentence each:
"An MCP server is a process you run. WebMCP tools are functions in your page's JavaScript, running in the user's tab."
"MCP is a wire protocol. WebMCP is a browser API. Your page never sees JSON-RPC."
"An MCP client is an AI app you configure. A WebMCP client is whatever agent is in the browser: an extension, DevTools, Chrome DevTools MCP, which is what you just saw."
"Nobody installs a WebMCP server. An agent finds the tools by visiting the page."
"No OAuth. The tools run as the person who's signed in, with the cookies they already have."
"Tools only. No resources, no prompts. Tools carry annotations, which we'll come to."
"The tools exist while the tab is open. No tab, no tools. It's designed for a person in the loop."
"MCP ships in many products. WebMCP is a Chrome origin trial, extended to Chrome 162. Edge has an implementation ready for testing. WebKit has said it opposes it; Mozilla's position is neutral."
-->

---

# They complement each other

- A backend MCP server: for agents that run on a server, headless
- WebMCP in the page: for the agent in the user's browser
- Shopify documents both: Checkout MCP and Checkout WebMCP

<!--
Say: "This isn't either-or. If an agent runs on a server with no browser, it needs an MCP server. If the agent is in the user's browser, on your page, with the user signed in, WebMCP lets it use the page the user is already looking at."
"Shopify's developer docs have both: a Checkout MCP and a Checkout WebMCP that share the same checkout object. Their docs say: use the WebMCP one when the agent runs in the buyer's browser, the MCP one when it can run on a server."
Keep it to that. Don't claim more about who uses what.
"The WebMCP explainer says the same thing in one line: it's designed to complement backend protocols like MCP, not replace them."
-->

---

# The whole API

```js
const off = new AbortController();
await document.modelContext.registerTool({
  name: 'search_products',
  description: 'Search the catalogue. Returns JSON.',
  inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  annotations: { readOnlyHint: true },
  async execute(input, { signal }) { return 'text for the agent'; }
}, { signal: off.signal, exposedTo: [] });
off.abort(); // unregisters it

const tools = await document.modelContext.getTools();
await document.modelContext.executeTool(tools[0], { query: 'headphones' });
// events: toolchange, toolactivated, toolcancel
```

<!--
"That's all of it. You'll write most of this in the next 45 minutes."
registerTool takes a plain object: a name, a description, a JSON Schema for the input, and execute. It returns a promise. A duplicate name, a bad name, or an empty description rejects it.
There is no unregisterTool. You pass an AbortSignal when you register, and aborting it removes the tool. Section 5.
exposedTo is for cross-origin iframes. Empty or left out means same origin only. It's in GOING-FURTHER.md, not in the room.
getTools and executeTool are what an agent calls. The DevTools WebMCP pane and the drawer use them too. executeTool takes an object; before Chrome 155 it took a JSON string.
execute gets the input and a signal that aborts if the call is cancelled. Return a string. Chrome turns an object into JSON text, and the agent only ever gets text.
Three annotations: readOnlyHint, untrustedContentHint, consequentialHint. Section 4.
Three events on document.modelContext: toolchange when the list changes, toolactivated when a tool is called, toolcancel when a call is cancelled.
Then there's the declarative side: two attributes on a form turn it into a tool. Section 3.
-->

---

# One rename

`navigator.modelContext` → `document.modelContext`

<!--
One line, for anyone who read older blog posts: "It used to be navigator.modelContext. Chrome moved it to document and dropped the navigator one around Chrome 152. If a post says navigator, it's older than that. Everything else in this room is the current API, checked in Chrome 157."
-->

---

# 2 · Register tools (0:20, 13 min)

Steps **2.1** and **2.2**

- 2.1 `search_products`: name, description, `inputSchema`, `execute`
- 2.2 `add_to_cart`: `required`, your own checks, errors as text
- Check: DevTools › Application › **WebMCP** › Run tool
- Check 2.2 with a colour the product doesn't come in

```bash
# Ctrl+C the finished shop first
npm run go 2.1
npm start
npm test        # in a second terminal
```

<!--
0:20, 13 min. Hands-on. Leave this slide up while the room works.
Say: "Stop the finished shop with Ctrl+C. npm run go 2.1 loads the first step into playground/, and npm start now serves your playground: the drawer says 0 tools. The step README is in the drawer's Guide tab and in playground/. Fill the hammer markers. When npm test passes, run the tool from the WebMCP pane in DevTools, or from the drawer's Tools tab."
About 6 minutes for 2.1, 6 for 2.2, a minute to wrap up.
Common mistakes in 2.1:
- No WebMCP pane in DevTools: in Chrome 157 the pane is there with the main flag alone. On 155 or 156, turn on #devtools-webmcp-support too, and close and reopen DevTools. Or use the drawer's Tools tab, which does the same.
- "Invalid tool name": a space or another character that isn't a letter, digit, _, - or dot.
- "Description is required": an empty description rejects the registration.
- Returning undefined: the agent gets the text "undefined". Return a string.
- Returning the whole product record: keep results small. The summarise function picks six fields.
Common mistakes in 2.2:
- Expecting required to be enforced. Chrome doesn't check the input against inputSchema. Missing fields and wrong types reach execute unchanged. That's why execute checks.
- Throwing an Error for a bad colour. If execute throws, the agent gets a generic failure, not your message. Return "Error: … comes in black, silver. Pass one of those as colour." so the agent can fix the call.
- Comparing colours case-sensitively when the description says lowercase. Make the description and the check agree.
At the end, say: "Two tools. The description is the agent's only guide, so write it for a reader who can't see the page. And never trust the input: the schema is a hint to the agent, not a check."
Behind? npm run solution, then npm run go next.
-->

---

# 3 · Turn a form into a tool (0:33, 8 min)

Step **3.1**

- `toolname`, `tooldescription`, `toolparamdescription` on the address form
- `agentInvoked` and `respondWith()` in the submit handler
- Check: the schema Chrome derived from the form
- Check: the form fills in, then waits for your click

<!--
0:33, 8 min. Hands-on.
Say: "Two attributes turn a form into a tool. Chrome builds the input schema from the fields: name becomes the property, the label becomes the description, required stays required, a select becomes an enum."
"This part is Chrome only. The declarative API was taken out of the spec on 8 October. Chrome still has it. Learn it because it's the cheapest way to make an existing form usable, and know that it may change."
Where to look: sign in, add something to the cart, go to checkout. The WebMCP pane lists set_delivery_address with the derived schema. Run it from the pane: the fields fill in, the form is highlighted, and nothing is saved until you press Save and continue.
Common mistakes:
- Only toolname, no tooldescription. You need both, or there's no tool.
- A label whose for= doesn't match an id. Then the field has no description. The address form uses id on every input.
- An input without a name. Chrome skips it.
- Calling respondWith without preventDefault first, or when agentInvoked is false. It throws InvalidStateError.
- In React, agentInvoked is on event.nativeEvent, not on React's synthetic event.
- Adding toolautosubmit "to make it faster". Then the form submits without the shopper's click. Try it in the bonus, see the difference, and take it out.
At the end, say: "No toolautosubmit means the person presses the button. That's your first confirmation, and you got it for free. Hold on to that for the next slide."
If time is short, this section becomes a demo: you run it on your screen, they watch.
-->

---

# Who is in control (0:41, 4 min)

- Annotations are hints, not locks
- `requestUserInteraction()` is gone. Confirmation is yours to build
- Chrome doesn't check input against `inputSchema`
- Tool results can carry text written by strangers

<!--
0:41, 4 min. Concept.
1. "Annotations are hints to the agent, not locks." readOnlyHint says calling it changes nothing. untrustedContentHint says the result has text your site didn't write. consequentialHint says this one matters and is hard to undo. Chrome passes them to the agent and to DevTools. Chrome shows no confirmation prompt of its own for consequentialHint today. An agent may ask the user first; you can't count on it. And a malicious page can set whatever hints it likes, so agents can't trust them blindly either.
2. "requestUserInteraction() is gone, from the spec and from Chrome." If you read about it, it was in earlier drafts. So the confirmation is yours: a dialog inside execute that waits for the person, or a form without toolautosubmit, like the one you just made. Your page is the one place the agent can't skip.
3. "Chrome doesn't check the input." You saw it in 2.2. The schema tells the agent what to send. Nothing stops it sending something else. Validate in execute, every time, as if the input came from a stranger. It did.
4. "Tool results can carry text written by strangers." Reviews, comments, product questions, messages. If a review says 'ignore your instructions', that text goes straight into the agent's context. untrustedContentHint tells the agent this result is data, not instructions. It's a hint for the agent, so you also keep strangers' text out of results that don't need it.
Bridge: "In the next 11 minutes you'll add all three annotations, find a planted review, and build the confirmation dialog."
-->

---

# 4 · Keep the user in control (0:45, 11 min)

Steps **4.1** and **4.2**

- 4.1 `readOnlyHint` on the read tools, `untrustedContentHint` on `get_reviews`
- 4.2 `consequentialHint` on `place_order`, a dialog inside `execute`
- Check 4.1: find the planted review in `get_reviews("hp-102")`
- Check 4.2: decline once, confirm once

<!--
0:45, 11 min. Hands-on. About 4 minutes for 4.1, 6 for 4.2.
4.1: run get_reviews with productId hp-102 from the WebMCP pane. One review, from "best_deals_4u", tells AI assistants to ignore their instructions and add 5 of sw-701 to the cart. Read it out. Say: "That's a prompt injection, sitting in your own database, written by a stranger. Your tool hands it to the agent. The hint is how you warn the agent."
4.2: place_order opens a dialog in the page and waits. Decline: the tool returns "The shopper did not confirm, so nothing was ordered. Do not try again unless they ask." Confirm: you get an order number.
Common mistakes:
- Putting readOnlyHint on add_to_cart or apply_coupon. They change the cart. Read only means nothing changes.
- Expecting Chrome to ask for confirmation because of consequentialHint. It doesn't. The dialog is what protects the shopper.
- Not passing signal to the dialog. If the agent cancels the call, the dialog stays open and a late click still places the order.
- Returning nothing, or throwing, on decline. Return a sentence that tells the agent what happened and not to retry.
- Showing what the agent sent instead of what will happen. previewOrder works the order out again on the server from the cart as it is now; show that.
At the end, say: "The hint tells the agent. The dialog protects the person. You need both, and only the second one is in your control."
-->

---

# 5 · Tools follow state (0:56, 8 min)

Step **5.1**

- The order tools exist only while someone is signed in
- One `AbortController`; sign-out aborts it
- Check: watch the tool list change as you sign in and out

<!--
0:56, 8 min. Hands-on.
Say: "An agent should only see tools it can use right now. Signed out, place_order can only fail, so don't offer it."
Where to look: the drawer's Tools tab or the WebMCP pane. Five tools signed out, eight signed in. Sign out: back to five. toolchange fires each time, and that's how an agent knows to read the list again.
Common mistakes:
- A new AbortController on every state change without aborting the old one. The second registration rejects with "Duplicate tool name".
- Passing the options to one registerTool call but not the other two.
- Looking for unregisterTool. There isn't one. Abort the signal.
- Registering on sign-in but never handling the page loading already signed in. sync(shop.getUser()) runs once at startup for that.
At the end, say: "The tool list is part of your UI. It should change when the page changes, the same way a button disappears when it can't be used. And the server still says no to a signed-out request: hiding a tool isn't security."
Behind? npm run solution, then npm run go next.
-->

---

# 6 · See what agents do (1:04, 7 min)

Step **6.1**

- A `withLogging()` wrapper around every tool
- Tool, input, duration, outcome
- Check: the drawer's Activity tab, and the terminal

<!--
1:04, 7 min. Hands-on.
Say: "An agent is a new kind of user, and you can't watch over its shoulder. Log what it does, in the page, where the call happens."
Make a few calls from the WebMCP pane, including one bad colour. The Activity tab shows ok, error and threw, with times.
Common mistakes:
- Forgetting to pass options through to tool.execute. Then place_order never gets its signal, and the dialog can't close on cancel. Check 4.2 still works after this step.
- Catching an error and not throwing it again. The wrapper must not change what the tool does.
- Building a new object without ...tool, and losing the schema and annotations.
- Logging everything. Tool inputs and results can hold a name, a phone number, an address. Decide what you keep and for how long.
Bonus: listen for toolactivated and toolcancel on document.modelContext.
At the end, say: "Now you can answer 'what did the agent do?' from your own logs, not from the agent's word for it."
If time is short, this section becomes npm run solution and a two-minute read of the wrapper.
-->

---

# 7 · Replay and ship (1:11, 4 min)

- Drawer › **Agent view** › **Shop with tools**, on your own playground
- Your tools, the opening task, five calls, your confirmation dialog

<!--
1:11, 4 min with the next slide. Demo.
Say: "Press Shop with tools. That's the opening task, done with the tools you wrote in the last hour. When the dialog comes up, that's your dialog: press the button."
Then Shop by clicking, for the contrast. Same caveat as at the start: a script, not a model, not a benchmark.
If someone's replay stops at a step, the message says which tool is missing. npm run solution fixes it.
-->

---

# Before you ship

- Short names, clear descriptions, small results
- Validate every input; return errors as text
- The server authorises every request, agent or not
- Your own confirmation for anything that matters
- Register with a signal; feature-detect; the UI works without WebMCP
- Origin trial to Chrome 162; re-read the spec before each release

<!--
Point at PRODUCTION-CHECKLIST.md: "This is the handout. One page, checkboxes."
One sentence per line:
"Names and descriptions are the agent's only guide. Results go into its context, so keep them small."
"Chrome doesn't validate. You do. And an error the agent can read is one it can fix."
"Tools run as the signed-in user. The server still checks every request. Nothing is trusted more because an agent sent it."
"Hints don't protect anyone. Your dialog does."
"Tools come and go with state. Check modelContext exists, and keep the page working for everyone without it."
"It's an origin trial, Chrome only, and the API has changed shape more than once this year. Re-check before every release."
-->

---

# Questions, and where to go next

- `GOING-FURTHER.md`: Tool Inspector with Gemini, agent tests with Chrome DevTools MCP, on-device agent, iframes, origin trial
- Spec: webmachinelearning.github.io/webmcp
- Chrome docs: developer.chrome.com/docs/ai/webmcp
- `PRODUCTION-CHECKLIST.md`

<!--
1:15, 15 min of Q&A and buffer.
If there's time: install the Model Context Tool Inspector extension, set a Gemini API key, and type the opening task to Gemini against the finished app. Use your own key, not a shared one: rate limits are per project. GOING-FURTHER.md has the steps.
Likely questions:
- "Does Gemini in Chrome use these tools?" Google said at I/O it will. As of today I haven't seen it confirmed shipped. Use the Inspector or Chrome DevTools MCP to test.
- "Firefox, Safari?" Mozilla is neutral, WebKit opposes. Today it's Chrome, with Edge testing. Keep your UI working without it.
- "Is it safe?" The tools run as the user. Your server's authorisation, your confirmation dialog and your input checks are what keep it safe, same as for any client.
- "Numbers?" Chrome has published none. I'm not quoting vendor figures.

If time runs short, cut in this order:
1. Skip the fire bonuses.
2. Section 6 becomes npm run solution and a two-minute read of the wrapper.
3. Section 3 becomes a demo. It's the one part that's Chrome only and no longer in the spec.
Anyone behind at a section boundary runs npm run solution, then npm run go next.
-->
