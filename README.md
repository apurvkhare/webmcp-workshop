# Hands-on WebMCP

Workshop material for **Hands-on WebMCP: Expose Your Web App to AI Agents** (GDG Cloud Bengaluru DevFest). You take Namma Bazaar, a working online shop, and make it agent-ready: tools an AI agent in the browser can call, instead of pages it has to read and click through.

Everything is here: seven steps across five hands-on sections, two no-code sections around them, the finished app, a workshop drawer in the page with the live tool list, and the setup for working with an AI coding agent. Nothing calls a model and there is no API key: you play the agent yourself, from DevTools or the drawer. Do it in the room, or on your own with [CODELAB.md](CODELAB.md).

It teaches the WebMCP API as Chrome ships it in November 2026: `document.modelContext.registerTool(tool, { signal })`, tool annotations, and the declarative form attributes. It needs **Chrome 155 or later with a flag turned on**. See [SETUP.md](SETUP.md).

## The sections

| Section | What you do | Steps |
|---|---|---|
| 1 · An agent goes shopping | Watch one task done by clicking and then with tools, and compare what the agent had to read. No code | – |
| 2 · Register tools | `search_products` with a JSON Schema, then `add_to_cart` with input checks and errors an agent can act on | 2.1, 2.2 |
| 3 · Turn a form into a tool | `toolname` and `toolparamdescription` on the address form, and `respondWith()` in its submit handler | 3.1 |
| 4 · Keep the user in control | Annotations on every tool, and a confirmation dialog before `place_order` | 4.1, 4.2 |
| 5 · Tools follow state | Order tools registered at sign-in and removed at sign-out, with an `AbortSignal` | 5.1 |
| 6 · See what agents do | A wrapper that logs every tool call | 6.1 |
| 7 · Replay and ship | The opening task on your own code, then the production checklist. No code | – |

The 75-minute run of show is in [AGENDA.md](AGENDA.md).

## Setup

Needs Chrome 155 or later, Node 20.19 or later, and git. Full instructions, to do before the day: [SETUP.md](SETUP.md).

```bash
npm install
npm run doctor
```

`doctor` checks Node, the dependencies, the port, your Chrome version, and the finished app's tests.

## With an AI agent

[AGENTS.md](AGENTS.md) tells your agent how the workshop works: one step at a time, only in `playground/`, no peeking at solutions, and an explanation of what it wrote at the end. Cursor, Copilot, Codex and Antigravity read it directly, and Claude Code reads it through `CLAUDE.md`.

Say "do step 4.2", or use the shortcut: `/step 4.2` in Claude Code.

<!-- codelab:start -->
## How the workshop works

Each step is a pair of folders in `exercises/`: a **problem** with gaps marked 🔨, and its **solution**. You work in `playground/`.

```bash
npm run go 2.1      # load step 2.1 into playground/
npm start           # run the shop on http://localhost:5173
npm run status      # where you are, what's left, and whether the tests pass
npm test            # check the step
npm run go next     # on to the next step
```

Each step's `README.md` (also copied into `playground/`) has the task, how it works, what to look for, what breaks without it, and "Explain it back" questions.

The shop has a **workshop drawer** on the right of the page. If it is closed, the Workshop button at the right edge opens it. It is not part of the shop, and agents don't see it.

| Tab | What it shows |
|---|---|
| Guide | The current step's README. It switches by itself when you run `npm run go` |
| Tools | The tools the page has registered right now, with their schemas, and a form to run each one. The same as DevTools > Application > WebMCP |
| Activity | Every tool call the page logged (from step 6.1) |
| Agent view | What an agent has to read on this page, next to the tool list, and the two replays from section 1 |

Stuck? Read the 💡 hints in the code, then `npm run diff` to compare with the solution, then `npm run solution` to copy it in. Your own version is backed up to `.playground-backups/` first.

### The markers

| Marker | Meaning |
|---|---|
| 🔨 | Build: what to write, with its step number (`🔨 4.2`) |
| 💡 | Hint: the shape of the answer |
| 🧠 | Why: the reason it works this way |
| 📡 | Look: what to find in DevTools > Application > WebMCP, or the drawer |
| 📖 | Docs: a spec or documentation link |
| 🧪 | Test: what `npm test` checks |
| 🔥 | Bonus: extra credit for fast finishers |
| ✅ | Done: work from an earlier step |
<!-- codelab:end -->

## Commands

Every command is non-interactive. Add `-- --json` for JSON output, for example `npm run status -- --json`.

| Command | What it does |
|---|---|
| `npm run go <step>` | Load a step's problem into `playground/` (`--solution` for its solution, `next` for the next step) |
| `npm run status` | Current step, open 🔨 markers with file and line, and the test result |
| `npm test` | Run the playground's tests: this step's and every earlier one's |
| `npm run diff` | Your playground against the current step's solution |
| `npm run solution` | Copy the current step's solution into `playground/` |
| `npm start` | Run the shop with the playground's tools, and reload as you save. `-- --app app` runs the finished app, `-- --port 5174` uses another port |
| `npm run doctor` | Check this machine is ready |

For workshop authors: `npm run cut` regenerates every exercise folder and `app/` from `scripts/authoring/source/`. `npm run verify` checks every step: typecheck, tests, markers and READMEs. `npm run verify:chrome` runs every solution in a real Chrome with WebMCP on. `npm run codelab` rebuilds `CODELAB.md`.

## What is where

| Path | What it is |
|---|---|
| `exercises/` | The steps, one folder per section. Each step is a problem folder and a solution folder |
| `playground/` | Where you work. `npm run go` fills it. Not committed |
| `app/` | The finished WebMCP code: the last step's solution |
| `app/webmcp/index.ts` | `setupWebMCP(shop)`: feature detection, and which tools are registered when |
| `app/webmcp/catalog-tools.ts` · `cart-tools.ts` · `order-tools.ts` | The eight tools |
| `app/webmcp/logging.ts` | `withLogging()`, the wrapper from step 6.1 |
| `app/ui/AddressForm.tsx` | The form that is also a tool |
| `shop/` | The shop itself: the React UI, the API server, the seed data, the workshop drawer, and test helpers. Not WebMCP code, shared by every step |
| `shop/src/webmcp.d.ts` | TypeScript types for `document.modelContext`, written for this workshop from the spec |
| `scripts/` | The commands above. `scripts/authoring/` holds the source every step is cut from |
| `slides/` · `demo/` | The deck (in Google Slides, linked from `slides/README.md`) with its outline and speaker notes, and the runbook for the opening demo |
| `PRODUCTION-CHECKLIST.md` · `GOING-FURTHER.md` | The handout, and what didn't fit in 90 minutes |

## What this was checked against

WebMCP is an origin trial, and it changes. This material was written and checked on 15 November 2026:

- The [WebMCP draft](https://webmachinelearning.github.io/webmcp/) of 13 November 2026.
- Chrome 157. `npm run verify:chrome` runs every step's solution in a real Chrome with WebMCP on.
- Chrome's origin trial runs from Chrome 149 to Chrome 162. Before Chrome 152 the API was on `navigator.modelContext`; before Chrome 155, `executeTool` took its input as a JSON string. Older posts and videos show both.
- The form attributes in section 3 are in Chrome and were removed from the spec draft in October 2026. Section 3 says so.

If you are reading this much later, start with [SETUP.md](SETUP.md)'s troubleshooting and the spec's changelog.
