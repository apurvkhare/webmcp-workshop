# Agenda: Hands-on WebMCP

GDG Cloud Bengaluru DevFest · GDG-CFP-2026-U0JF5 · intermediate · own laptops.

The slot is 90 minutes. The content is planned for **75 minutes**, so a late start or a slow section doesn't cost the ending. The last 15 minutes are Q&A and buffer.

You take **Namma Bazaar**, a working online shop, and make it agent-ready in seven small steps. Each step is a problem folder and a solution folder.

## Run of show

| Clock | Min | Section | Kind | Steps |
|---|---|---|---|---|
| 0:00 | 4 | Welcome and setup check: `npm run doctor`, flag on, shop open | Setup | – |
| 0:04 | 10 | **1 · An agent goes shopping**, without WebMCP and then with it | Demo, no code | – |
| 0:14 | 6 | MCP and WebMCP side by side, then the whole API on one slide | Concept | – |
| 0:20 | 13 | **2 · Register tools** with `document.modelContext.registerTool()` and JSON Schema | Hands-on | 2.1, 2.2 |
| 0:33 | 8 | **3 · Turn a form into a tool** with `toolname` and `toolparamdescription` | Hands-on | 3.1 |
| 0:41 | 4 | Who is in control: annotations, confirmation, untrusted content | Concept | – |
| 0:45 | 11 | **4 · Keep the user in control** | Hands-on | 4.1, 4.2 |
| 0:56 | 8 | **5 · Tools follow state**: register and unregister with `AbortSignal` | Hands-on | 5.1 |
| 1:04 | 7 | **6 · See what agents do**: log every call | Hands-on | 6.1 |
| 1:11 | 4 | **7 · Replay and ship**: the opening task on your own playground, and the production checklist | Demo | – |
| 1:15 | 15 | Q&A and buffer. If there is time: the same task typed to Gemini in the Model Context Tool Inspector | Buffer | – |

Concept 10 min · demo 14 min · hands-on 47 min · setup 4 min · Q&A and buffer 15 min.

## The steps

| Step | You write | You check it by |
|---|---|---|
| 2.1 | `search_products`: name, description, `inputSchema`, an `execute` that returns a string | Running it from DevTools > Application > WebMCP |
| 2.2 | `add_to_cart`: `required` in the schema, your own input checks, errors returned as readable text | Running it with a colour the product doesn't come in |
| 3.1 | `toolname`, `tooldescription` and `toolparamdescription` on the delivery address form, then `agentInvoked` and `respondWith()` in its submit handler | Seeing the schema Chrome derived from the form, and the form waiting for your click |
| 4.1 | `readOnlyHint` on the read tools, `untrustedContentHint` on `get_reviews` | Finding the planted "ignore your instructions" review in the tool result |
| 4.2 | `consequentialHint` on `place_order`, and a confirmation dialog inside `execute` that closes when `signal` aborts | Declining once and confirming once |
| 5.1 | The order tools registered only while signed in; one `AbortController` removes them on sign-out | Watching the tool list change as you sign in and out |
| 6.1 | A `withLogging()` wrapper: tool, input, duration, outcome | Reading the Activity tab and the terminal after a few calls |

Each step is five to twenty lines. Every step README has the task, how it works, what to look for, what breaks without it, and "Explain it back" questions.

🔥 Bonuses for fast finishers, never needed by a later step: `title` and `outputSchema` (2.1), `tooltitle`, `:tool-form-active` styling and `toolautosubmit` (3.1), `toolactivated` and `toolcancel` listeners (6.1).

## What each section covers

### 1 · An agent goes shopping (demo, 10 min)

One task, done twice:

> Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot.

- **On the projector, with a real agent** (Gemini CLI or Claude Code through Chrome DevTools MCP). Without WebMCP it reads a page snapshot, clicks, and reads again, page after page. With WebMCP it lists the tools and makes five calls, and the DevTools WebMCP pane shows each one. The runbook is in [demo/README.md](demo/README.md).
- **On every laptop, with no model and no key.** The workshop drawer's **Agent view** tab shows what an agent has to read on the current page next to the tool list, with sizes. Its two replay buttons do the task both ways: a script that clicks through the UI the way a UI-driving agent would, and a script that calls the tools. Both count steps and how much text the agent had to read.

The replay is scripted, not a model. It shows the shape of the two approaches, not a benchmark.

Fallback if the venue network fails: the in-app replay, and a recording of the real agent made during the dry run.

### MCP and WebMCP (concept, 6 min)

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

### Who is in control (concept, 4 min)

- Annotations are hints to the agent, not locks. Chrome shows no confirmation prompt of its own for `consequentialHint` today.
- `requestUserInteraction()` is gone from the spec and from Chrome. Confirmation is yours to build: a dialog inside `execute`, or a form without `toolautosubmit`.
- Chrome does not check input against `inputSchema`. Validate in `execute`.
- Tool results can carry text written by strangers. `untrustedContentHint` says so.

### 7 · Replay and ship (4 min)

The opening task again, with the tools you wrote: the **Shop with tools** replay in the drawer, on your own playground. Then the [production checklist](PRODUCTION-CHECKLIST.md).

## If time runs short

1. Skip the 🔥 bonuses.
2. Section 6 becomes `npm run solution` and a two-minute read of the wrapper.
3. Section 3 becomes a demo. It is the one part that is Chrome-only and no longer in the spec.

Anyone behind at a section boundary runs `npm run solution`, then `npm run go next`.

## Format, carried over from the MCP Apps workshop

- `exercises/NN.section/NN.problem.slug` and `NN.solution.slug`, with a section `README.md` and a `FINISHED.md` ("Talk it over").
- You work in `playground/`. `npm run go 2.1`, `npm start`, `npm run status`, `npm test`, `npm run diff`, `npm run solution`, `npm run doctor`. Every command takes `-- --json`.
- The same markers: 🔨 build, 💡 hint, 🧠 why, 📡 what to look for (here: the WebMCP pane and the drawer), 🧪 test, 📖 docs, 🔥 bonus, ✅ done earlier.
- `app/` is the finished WebMCP code. `shop/` is the shop itself (UI, API server, seed data) and is not WebMCP code.
- `AGENTS.md` and a `/step` skill, so an attendee's coding agent does one step at a time and explains it.
- A workshop drawer on the shop page: the current step's guide, the live tool list with a run form, the activity log, and the agent view.
- `SETUP.md` to do before the day, `CODELAB.md` to follow alone, and `PRODUCTION-CHECKLIST.md` as the handout.
- Tests run offline against a small spec-shaped `document.modelContext` double. `npm run verify:chrome` runs every solution in a real Chrome with WebMCP on.

## What attendees need

- The latest Chrome (155 or later), with `chrome://flags/#enable-webmcp-testing` enabled, and `#devtools-webmcp-support` too if it is listed.
- Node 20.19 or later, git, a code editor.
- Optional: a coding agent. Optional: a free Gemini API key and the Model Context Tool Inspector extension.

No API key is needed for any step.

## Out of the 90 minutes

In [GOING-FURTHER.md](GOING-FURTHER.md), not in the room: a Prompt API (Gemini Nano) agent, automated agent tests with Chrome DevTools MCP, cross-origin iframes (`allow="tools"`, `exposedTo`, `fromOrigins`), and deploying with an origin trial token.
