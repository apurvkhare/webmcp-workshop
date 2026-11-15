# AGENTS.md

This repo is a **hands-on workshop**: Hands-on WebMCP. A person is learning here, and you are helping them do one step at a time. The goal isn't finished code. The goal is that they understand the code you write. Work in small, explained steps, and stop when the step is done.

## The rules

1. **Start with `npm run status -- --json`.** It tells you the current step, the open 🔨 markers with file and line, and the test result. Run it before anything else, and again whenever you're unsure.
2. **Edit only `playground/`.** Never edit `exercises/`, `app/`, `shop/` or `scripts/`.
3. **Do only the current step's 🔨 markers.** Not the next step, and not 🔥 bonus work, unless the person asks for it.
4. **Don't look at the answer.** Don't read or copy from `exercises/**/*.solution.*`, `app/` or `scripts/authoring/source/`, and don't run `npm run diff` or `npm run solution`, unless the person asks you to. Work from the step's `playground/README.md`, the 💡 hints, and the types in `shop/src/webmcp.d.ts` and `shop/src/client/shop.ts`.
5. **Check with `npm test -- --json`.** It runs this step's tests and every earlier step's. The step is done when all of them pass. If an earlier step's test breaks, fix that first.
6. **Explain it back.** When the tests pass, answer each question under "Explain it back" in `playground/README.md`, in the chat, quoting the lines you wrote. Then stop and let the person read it. Don't move to the next step until they say so.
7. **Leave the browser to the person.** Each README has a 📡 section about what to look for in DevTools > Application > WebMCP, or in the workshop drawer on the shop page. Tell them what to run and what they should see.

## Doing a step

When the person says "do step 4.2", or `/step 4.2`:

1. `npm run status -- --json --no-test`. If the playground isn't on 4.2, run `npm run go 4.2 -- --json`. It backs up the old playground first, so this is safe. If `backup` isn't null, mention its path.
2. Read `playground/README.md`.
3. Find the work: the `todo` list from `status`, or `grep -rn "🔨" playground --exclude-dir=tests --exclude=README.md`.
4. Fill each 🔨 marker. Replace the whole marker block, meaning the 🔨 line and the 💡 🧠 📡 🧪 📖 lines under it, with the code, the way a finished step looks. Leave 🔥 lines in place. Keep ✅ lines: they mark earlier work.
5. `npm test -- --json`. If something fails, read the failure message, fix it, and run it again.
6. `npm run status -- --json --no-test` should show no 🔨 left.
7. Answer "Explain it back" (rule 6). Then suggest they run `npm start` (if it isn't running already), open <http://localhost:5173>, and do what the 📡 section describes.

When the person writes the code themselves and asks for help, give a hint first (the 💡 line, or the next small step). Write the code only if they ask.

## The markers

Every marker is one emoji with a fixed meaning. They're comments in `.ts` and `.tsx` files.

| Marker | Meaning | What to do |
|---|---|---|
| 🔨 | Build. The step number follows: `🔨 4.2` | The work. Replace it with code |
| 💡 | Hint: the shape of the answer | Follow it |
| 🧠 | Why it works this way | Use it in your explanation |
| 📡 | What to look for in the WebMCP pane or the drawer | Tell the person to look |
| 📖 | Docs link | Read it if you need more |
| 🧪 | What `npm test` checks | Make it pass |
| 🔥 | Bonus for fast finishers | Only when asked |
| ✅ | Done in an earlier step | Leave it |

## Commands

None of them prompt. Each prints plain text, or one JSON object with `-- --json`. The `--` matters: npm keeps a bare `--json` for itself.

| Command | What it does |
|---|---|
| `npm run status -- --json` | Current step, open 🔨 markers, test result, and the suggested next action. `--no-test` skips the tests |
| `npm run go <step> -- --json` | Loads a step's problem into `playground/` and backs up the old one. `next` for the next step, `--solution` for the solution |
| `npm test -- --json` | Runs the playground's tests. Exits 1 if any fail |
| `npm run diff -- --json` | Playground against the step's solution. Only when asked |
| `npm run solution -- --json` | Copies the step's solution into `playground/`. Only when asked |
| `npm start` | Runs the shop on port 5173 with the playground's code. Long-running: run it in the background, or ask the person to run it in their own terminal. It reloads on save and on `npm run go` |
| `npm run doctor -- --json` | Checks the machine: Node, dependencies, the port, Chrome, tests |

Steps: 2.1 and 2.2, 3.1, 4.1 and 4.2, 5.1, 6.1. Sections 1 and 7 have no code.

## The project

- **`playground/webmcp/`** is the WebMCP code. `index.ts` has `setupWebMCP(shop)`, which the shop calls once when the page has loaded. `catalog-tools.ts`, `cart-tools.ts` and `order-tools.ts` each describe tools and register them. `logging.ts` (step 6.1) wraps a tool so its calls are logged.
- **`playground/ui/AddressForm.tsx`** is the one React component a step changes (3.1).
- **`shop/`** is the shop: React UI, API server, seed data, the workshop drawer and test helpers. It isn't WebMCP code. Use what `@shop` exports; don't change it. `shop/src/client/shop.ts` has the `Shop` type the tools call.
- **TypeScript is strict.** Imports use the `.ts` and `.tsx` extensions. Match the style of the code around you: comments, naming, two-space indents, single quotes.
- **Don't add dependencies.** Everything the workshop needs is installed, and the room may be offline.

## The WebMCP API, as it is now

WebMCP is an origin trial and has changed shape several times. Most of what you may remember about it is out of date. This is what Chrome 155 and later does, and what `shop/src/webmcp.d.ts` types:

- The API is **`document.modelContext`**. `navigator.modelContext` was removed in Chrome 152. Don't use it, and don't add a fallback to it.
- **`registerTool(tool, { signal })`** returns a promise. It rejects on a duplicate name, an invalid name or an empty description.
- **There is no `unregisterTool()`, `provideContext()` or `clearContext()`.** A tool is removed by aborting the `AbortSignal` it was registered with.
- **There is no `requestUserInteraction()`.** `execute(input, { signal })` gets only an abort signal. To ask the user something, show UI in the page and await it.
- **A tool** is `{ name, description, inputSchema?, outputSchema?, title?, annotations?, execute }`. Annotations are `readOnlyHint`, `untrustedContentHint` and `consequentialHint`: hints, not enforcement.
- **`execute` returns a string.** Chrome doesn't validate input against `inputSchema`, so check it in `execute`. Return problems as `Error: …` text. A thrown error reaches the agent as a generic failure.
- **Agents call tools with `getTools()` and `executeTool(tool, input)`**, where `input` is an object. Events on `document.modelContext`: `toolchange`, `toolactivated`, `toolcancel`.
- **Forms:** `toolname` and `tooldescription` on a `<form>`, `toolparamdescription` on a field, optional `toolautosubmit`. In the submit handler, `event.agentInvoked` and `event.respondWith(promise)`. Chrome-only, and no longer in the spec draft. In React, use the lowercase attribute names and `event.nativeEvent`.
- **Always feature-detect:** `if (!('modelContext' in document)) return;`

When you're unsure, read `shop/src/webmcp.d.ts` and the tests in `playground/tests/` rather than guessing from older articles.

## Working on the workshop itself

The rules above are for people doing the workshop. If the person says they're **writing or changing the workshop** (the author, or a contributor), they don't apply. Instead:

- Steps are cut from one annotated source. Edit `scripts/authoring/source/`, never the generated `webmcp/`, `ui/` and `tests/` folders in `exercises/` or `app/`, then run `npm run cut`. The directives (`//#step`, `//#gap`, `//#before`, `//#end`, `//#file`, `#done`) are documented at the top of `scripts/authoring/cut.ts`.
- Step READMEs and the section `README.md` and `FINISHED.md` files are hand-written. A problem folder and its solution folder each have one. After changing any of them, or `SETUP.md`, run `npm run codelab` to rebuild `CODELAB.md`.
- `npm run verify` checks every step: the folders match the source, everything typechecks, each solution passes, each problem fails only its own step and has 🔨 markers, and every folder has a README. `npm run verify:chrome` runs each solution in a real Chrome with WebMCP on. Run both before committing.
- The step list lives in `scripts/steps.ts`.
- `shop/src/testing/model-context.ts` is the `document.modelContext` double the tests use. It mirrors what Chrome 157 does. If Chrome's behaviour changes, change the double, then `scripts/verify-chrome.ts`.
