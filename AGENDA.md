# Agenda: Hands-on WebMCP (90 minutes)

**Status: draft for review, 15 Nov 2026.** Nothing else in this repo is built yet.

GDG Cloud Bengaluru DevFest · GDG-CFP-2026-U0JF5 · intermediate · own laptops.

You take **Namma Bazaar**, a working online shop, and make it agent-ready: seven small steps, each one a problem folder and a solution folder, the same way the MCP Apps workshop ran.

## Run of show

| Clock | Min | Section | Kind | Steps |
|---|---|---|---|---|
| 0:00 | 4 | Welcome and setup check: `npm run doctor`, flag on, shop open | Setup | – |
| 0:04 | 12 | **1 · An agent goes shopping**, without WebMCP and then with it | Live demo, no code | – |
| 0:16 | 7 | MCP and WebMCP side by side, then the whole API on one slide | Concept | – |
| 0:23 | 14 | **2 · Register tools** with `document.modelContext.registerTool()` and JSON Schema | Hands-on | 2.1, 2.2 |
| 0:37 | 8 | **3 · Turn a form into a tool** with `toolname` and `toolparamdescription` | Hands-on | 3.1 |
| 0:45 | 5 | Who is in control: annotations, confirmation, untrusted content | Concept | – |
| 0:50 | 12 | **4 · Keep the user in control** | Hands-on | 4.1, 4.2 |
| 1:02 | 9 | **5 · Tools follow state**: register and unregister with `AbortSignal` | Hands-on | 5.1 |
| 1:11 | 8 | **6 · See what agents do**: log every call | Hands-on | 6.1 |
| 1:19 | 4 | **7 · Replay and ship**: the opening task on your own app, and the production checklist | Demo | – |
| 1:23 | 7 | Q&A, and buffer for anything that ran over | Buffer | – |

Concept 12 min · demo 16 min · hands-on 51 min · setup, Q&A and buffer 11 min.

## The steps

| Step | You write | You check it by |
|---|---|---|
| 2.1 | `search_products`: name, description, `inputSchema`, an `execute` that returns a string | Running it from DevTools > Application > WebMCP |
| 2.2 | `add_to_cart`: `enum` and `required` in the schema, your own input checks, errors returned as readable text | Running it with a bad variant and reading the answer |
| 3.1 | `toolname`, `tooldescription` and `toolparamdescription` on the delivery address form, then `agentInvoked` and `respondWith()` in its submit handler | Seeing the schema Chrome derived from the form, and the form waiting for your click |
| 4.1 | `readOnlyHint` on the read tools, `untrustedContentHint` on `get_reviews` | Finding the planted "ignore your instructions" review in the tool result |
| 4.2 | `place_order` with `consequentialHint` and your own confirmation dialog inside `execute`, closed when `signal` aborts | Declining once and confirming once |
| 5.1 | `place_order` and `get_orders` registered only while signed in with a non-empty cart; one `AbortController` removes them on sign-out | Watching the tool list change as you sign in and out |
| 6.1 | A `withLogging()` wrapper (tool, input, duration, outcome) plus `toolactivated` and `toolcancel` listeners | Reading the Agent activity panel after a few calls |

Each step is five to fifteen lines. Every step README has the task, how it works, what to look for in the WebMCP pane, what breaks without it, and "Explain it back" questions. 🔥 bonuses for fast finishers: `tooltitle` and `outputSchema` (2.x), `:tool-form-active` styling and `toolautosubmit` (3.1), sending the log to the server (6.1).

## What each section covers

### 1 · An agent goes shopping (demo, 12 min)

One task, run twice by a real agent (Gemini CLI or Claude Code through Chrome DevTools MCP):

> Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one in black to the cart, apply the coupon DEVFEST10, and check out to my saved address with the earliest delivery slot.

- **Without WebMCP**, on the starter shop: the agent reads a page snapshot, clicks, reads again. The variant swatches, the delivery slot picker and the three-step checkout are where it slows down or guesses.
- **With WebMCP**, on the finished shop: `list_webmcp_tools`, then four or five `execute_webmcp_tool` calls, with the DevTools WebMCP pane showing each one.
- **On your own laptop, no model and no key:** the workshop drawer's Agent's-eye view shows what an agent has to read on the current page (a snapshot, with its size) next to the tool list (with its size). Then you run one tool of the finished app by hand.

Fallback if the venue network fails: a recording of both runs, made during the dry run.

### MCP and WebMCP (concept, 7 min)

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

They complement each other: a backend MCP server for agents that run on a server, WebMCP for the agent in the user's browser. Then one slide with the whole API, and one line on the rename from `navigator.modelContext` for anyone who read older posts.

### Who is in control (concept, 5 min)

- Annotations are hints to the agent, not locks. Chrome shows no confirmation prompt of its own for `consequentialHint` today.
- `requestUserInteraction()` is gone from the spec and from Chrome. Confirmation is yours to build: a dialog inside `execute`, or a form without `toolautosubmit`.
- Chrome does not check input against `inputSchema`. Validate in `execute`.
- Tool results can carry text written by strangers. `untrustedContentHint` says so.

### 7 · Replay and ship (4 min)

The opening task again, this time against an attendee's own playground, through the Model Context Tool Inspector extension with Gemini. Attendees with a free AI Studio key can do the same. Then the production checklist handout.

## If time runs short

1. Skip the 🔥 bonuses. They are never needed for a later step.
2. Section 6 becomes `npm run solution` and a two-minute read of the wrapper.
3. Section 3 becomes a demo. It is the one part that is Chrome-only and no longer in the spec.

Anyone behind at a section boundary runs `npm run solution`, then `npm run go next`.

## Format, carried over from the MCP Apps workshop

- `exercises/NN.section/NN.problem.slug` and `NN.solution.slug`, with a section `README.md` and a `FINISHED.md` ("Talk it over").
- You work in `playground/`. `npm run go 2.1`, `npm start`, `npm run status`, `npm test`, `npm run diff`, `npm run solution`, `npm run doctor`. Every command takes `-- --json`.
- The same markers: 🔨 build, 💡 hint, 🧠 why, 📡 what to look for (here: the WebMCP pane and the agent log), 🧪 test, 📖 docs, 🔥 bonus, ✅ done earlier.
- `app/` is the finished shop. `shared/` is the shop itself (UI, API server, seed data) and is not WebMCP code.
- `AGENTS.md` and a `/step` skill, so an attendee's coding agent does one step at a time and explains it.
- A Guide pane with the current step, in a workshop drawer on the shop page.
- `SETUP.md` to do before the day, and `PRODUCTION-CHECKLIST.md` as the handout.
- Tests run offline against a small spec-shaped `document.modelContext` double. `npm run verify` runs every solution in real Chrome with the flag on.

## What attendees need

- Chrome 155 or later (stable is 158), with `chrome://flags/#enable-webmcp-testing` enabled, and `#devtools-webmcp-support` too if it is listed.
- Node 20.19 or later, git, a code editor.
- Optional: a free Gemini API key and the Model Context Tool Inspector extension, for section 7. Optional: a coding agent.

No API key is needed for any step.

## Out of the 90 minutes

In a "Going further" page, not in the room: a Prompt API (Gemini Nano) agent, automated agent tests with Chrome DevTools MCP, cross-origin iframes (`allow="tools"`, `exposedTo`, `fromOrigins`), and deploying with an origin trial token.

## What the spec and Chrome checks changed

- The declarative form API was removed from the spec on 8 October 2026. Chrome still implements it, so section 3 teaches it as Chrome-only.
- The origin trial now runs to M162, and Chrome has no ship milestone. The earlier "ships in M157" note was wrong.
- `executeTool()` took a JSON string before Chrome 155 and takes an object from 155, which sets the minimum version.
- `toolactivated` and `toolcancel` fire for imperative tools too, on `document.modelContext`.
- `execute` receives `{ signal }`. Return a string: Chrome passes objects to the agent as JSON text.

## Not verified yet

- Whether the DevTools WebMCP pane still needs its own flag on Chrome 157 and 158.
- Whether Gemini in Chrome calls WebMCP tools yet. The workshop does not depend on it.
- What an agent receives when `execute` throws. The steps return readable error text instead.
- Nothing above has been run in a browser. The build will check each solution in real Chrome.
