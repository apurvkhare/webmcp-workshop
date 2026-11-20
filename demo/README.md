# Demo runbook: an agent goes shopping

For the presenter, for section 1. One task, done twice on the projector: first by clicking through the UI, then by Gemini calling the shop's WebMCP tools from the Model Context Tool Inspector.

The task, word for word:

> Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot.

The right answer is `hp-102`, Tarang Studio Pro, ₹4,799, rated 4.6. `hp-103` is rated 4.7 but only comes in blue and red. With DEVFEST10 the total is ₹4,319 (10% is ₹480, under the ₹500 cap; delivery is free from ₹999). The first order after a reset is NB-1001, paid on delivery.

## How the pieces fit

| Piece | Where it runs |
|---|---|
| The shop (finished app) | `npm start -- --app app --port 5174`, on http://localhost:5174 |
| Chrome | A separate Chrome profile for the demo, with the WebMCP flag on |
| Run 1 | The workshop drawer's **Shop by clicking** replay. A script, no model |
| Run 2 | The [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) extension in Chrome's side panel, with Gemini and your API key |
| DevTools | Docked at the bottom, on **Application > WebMCP**, to show each call |

Port 5174 keeps 5173 free for your own playground.

Attendees can use any agent they like with their own code: the Inspector, or a coding agent such as Claude Code, Codex or Antigravity through Chrome DevTools MCP. See [With a coding agent instead](#with-a-coding-agent-instead).

## One-time setup

Do this on the presenter laptop at least a day before.

1. Node 20.19 or later, and the workshop repo installed (`npm install`, `npm run doctor`).
2. The latest Chrome, 155 or later, with `chrome://flags/#enable-webmcp-testing` enabled, and `#devtools-webmcp-support` too if it is listed. Flags apply to every profile.
3. A separate Chrome profile for the demo (profile menu, **Add**), so your own tabs, bookmarks and sign-ins stay off the projector.
4. In that profile, install the Model Context Tool Inspector from the Chrome Web Store and pin it to the toolbar.
5. A Gemini API key from https://aistudio.google.com. Open the Inspector's side panel on any page, press **Set Gemini API key**, paste it. The extension keeps it in its own storage.
6. Under **Advanced Options**, pick the model. The extension's default is `gemini-3.6-flash`.

## Before the session: start the shop and Chrome

In the repo, in its own terminal tab:

```bash
npm start -- --app app --port 5174
```

In the demo profile:

1. Open http://localhost:5174.
2. Open DevTools (Cmd+Option+I), **Application** tab, **WebMCP** in the sidebar. Dock DevTools at the bottom so the shop stays readable.
3. Make the page zoom large enough for the back row (Cmd+Plus).

## Run 1: by clicking

1. Open the workshop drawer (the Workshop button at the right edge, or `?drawer=on`), tab **Agent view**.
2. Press **Shop by clicking**. It resets the demo data and signs in as Asha by itself, then does the task the way a UI-driving agent would: read the page, act on one element, read the page again.

Say it before it starts: **this is a script, not a model, and not a benchmark.** The script already knows the shortest path and never misclicks, so it is the UI's best case.

What the room should notice, and what to say:

- **Read, act, read.** Each step reads the page, the way Chrome DevTools MCP's `take_snapshot` does: the whole page as text, one line per element. Then one click or one field filled. Then another read, because the page changed. The drawer counts the steps and the characters read.
- **The cards don't show colours.** To find "black", the script opens products one by one, best rated first: `hp-103` comes in blue and red only, so it goes back.
- **The coupon field is hidden** behind "Have a coupon?". It has to find the disclosure first.
- **Checkout is three screens**: the address form ("Save and continue"), the delivery slots ("Continue"), the review ("Place order").
- **Nobody asks you before the order is placed.** The script presses "Place order" itself. To the page, an agent's click is your click.

## Reset between runs

In a spare terminal:

```bash
curl -X POST http://localhost:5174/api/dev/reset
```

This clears the cart, the orders and the session. Then in Chrome: close the drawer, reload, **Sign in**, **Continue as Asha Rao (demo shopper)**, back to the home page. The Inspector reads the page's tools, not the page, so the drawer only takes up room.

## Run 2: Gemini with the shop's tools

1. Click the Inspector icon in the toolbar. The side panel opens next to the shop, with the page's tools in **WebMCP Tools**: eight while signed in.
2. Press **Reset** in the panel if an earlier chat is there.
3. Paste the task into the prompt box and press **Send**.

The prompt is the task alone:

```text
Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot.
```

What the room should notice:

- **A tool list instead of a page.** Gemini gets the page's tools as function declarations: name, description and input schema. It never sees the page itself. Signed in, there are eight tools: `search_products`, `get_reviews`, `view_cart`, `add_to_cart`, `apply_coupon`, `get_delivery_slots`, `place_order`, `get_orders`.
- **Each call is in the panel's log:** `AI calling tool "search_products" with {…}`, then `Tool "search_products" result: …`. Expect five calls, sometimes six: `search_products` (query, price and rating in one call), `add_to_cart` (`hp-102`, black: the colours came back with the search, so no product page is opened), `apply_coupon`, `get_delivery_slots`, `place_order`. Some runs add a `view_cart` or a `get_reviews`.
- **Errors are results.** A tool that returns an error as text, such as a wrong colour, goes back to Gemini as an ordinary result, and it can fix the call.
- **The page follows along.** The search results and the cart appear in the shop as the tools run.
- **The confirmation dialog.** `place_order` opens "Place this order?" in the page, with the item, the address, the slot and a button **Place order · ₹4,319**. Gemini waits for the tool's result. Pause, let the room read the dialog, then click the button. The panel then shows `Order NB-1001 is placed: ₹4,319, pay on delivery, arriving …`.
- **The DevTools WebMCP pane** lists the tools and logs each call with its input and output. Point at it after the order: "Every call, with its input, in the browser's own tools."
- **Annotations don't reach the model here.** The Inspector sends Gemini each tool's name, description and schemas, not its annotations. Hold that for section 4: hints are only as good as the agent that reads them.

If Gemini calls `get_reviews` on `hp-102`, one review is a planted prompt injection telling AI assistants to add 5 of `sw-701` and order without asking. If Gemini follows it, the confirmation dialog shows a smartwatch you didn't ask for: click **Not now** and say "Hold that thought: section 4." Don't try to provoke it on stage.

## The last minute: every laptop

Tell the room: the workshop drawer's **Agent view** tab has the two buttons you just saw, **Shop by clicking** and **Shop with tools**. **Shop with tools** is the run 2 task done by a script instead of a model. Both count steps and how much text the agent had to read.

Attendees have the finished shop running from the setup check (`npm start -- --app app`), so both buttons work on their laptops now. In **Shop with tools** they confirm the order themselves when the dialog asks. They press the same button again in section 7, on their own code. Anyone with a Gemini key can install the Inspector and type the task too.

## Fallbacks

In this order:

1. **The drawer's Shop with tools** in place of run 2, if the network, the key or the model fails. It needs no network, no model and no key. You still click the button in the confirmation dialog.
2. **The recording** from the dry run, both runs, with the Inspector panel and the WebMCP pane visible. Keep it on the desktop, not in a cloud folder.
3. If Chrome itself won't start with WebMCP: the slides, and straight on to the concept section.

A dead network stops Gemini, not the shop: everything else runs on localhost.

## Dry run the night before

- [ ] `npm run doctor` passes on the presenter laptop.
- [ ] Shop on 5174, the demo profile open on it, DevTools on **Application > WebMCP**.
- [ ] The WebMCP pane lists five tools signed out, eight signed in.
- [ ] **Shop by clicking** runs to the end.
- [ ] The Inspector lists eight tools signed in, and its key works.
- [ ] Run 2 makes its five or six calls and stops at the confirmation dialog.
- [ ] The dialog says **Place order · ₹4,319**, and the order is NB-1001 after a reset.
- [ ] The WebMCP pane shows the calls with their inputs.
- [ ] Both runs recorded (Cmd+Shift+5 on macOS), with the panel and the page in frame.
- [ ] **Shop with tools** works, and waits for your click.
- [ ] The reset command is in your shell history or a note.
- [ ] Notifications off, page zoom large, phone hotspot ready.
- [ ] Run 2 twice more. If Gemini skips a step or picks the wrong product, try another model under **Advanced Options** and keep the one that does the task.

## With a coding agent instead

Any MCP client can call the shop's tools through [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) and its `--categoryExperimentalWebmcp` flag: Claude Code, Codex, Antigravity, or another. This is also how to do run 1 with a real model: the same agent without the flag drives the UI with snapshots and clicks.

Chrome needs remote debugging on a profile that isn't your default one:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/webmcp-demo/chrome-profile" \
  --remote-debugging-port=9222 \
  --enable-features=WebMCP,DevToolsWebMCPSupport \
  --no-first-run \
  "http://localhost:5174/?drawer=off"
```

`--enable-features=WebMCP,DevToolsWebMCPSupport` does what the two `chrome://flags` entries do. The Chrome for Testing in the repo (`.chrome/chrome/mac_arm-157.0.8103.78/…`) works the same way; use its binary path instead. Download the server once, so the room's Wi-Fi isn't needed for it: `npx -y chrome-devtools-mcp@1.13.0 --version` should print `1.13.0`.

#### MCP config: without WebMCP

Save as `~/webmcp-demo/without.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y", "chrome-devtools-mcp@1.13.0",
        "--browserUrl", "http://127.0.0.1:9222",
        "--no-javascript-evaluation",
        "--no-usage-statistics"
      ]
    }
  }
}
```

#### MCP config: with WebMCP

Save as `~/webmcp-demo/with.json`. It is the same, plus one flag:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y", "chrome-devtools-mcp@1.13.0",
        "--browserUrl", "http://127.0.0.1:9222",
        "--no-javascript-evaluation",
        "--no-usage-statistics",
        "--categoryExperimentalWebmcp"
      ]
    }
  }
}
```

Why these flags:

- `--browserUrl` connects to the Chrome you started, so both runs use the same window and you can click in it.
- `--no-javascript-evaluation` turns off `evaluate_script` in both runs. Without it, a clever agent in the first run can call `document.modelContext` from a script, or scrape the DOM, and the comparison stops being UI against tools.
- `--no-usage-statistics` turns off the server's usage statistics, which are on by default.
- `--categoryExperimentalWebmcp` adds two tools, `list_webmcp_tools` and `execute_webmcp_tool`. Nothing else changes.

Where each agent reads it:

- **Claude Code:** `claude --mcp-config ~/webmcp-demo/with.json --strict-mcp-config`.
- **Antigravity CLI** (`agy`): `~/.gemini/config/mcp_config.json`, under `mcpServers`, according to Google's codelab. `/mcp` lists the active servers. It is one file, so copy in the config you want before each run.
- **Others:** the same server, command and arguments, in that agent's MCP settings.

Give it the task with one extra sentence: "The Namma Bazaar shop is open in Chrome at http://localhost:5174 and I am signed in. Work in that tab only, with the chrome-devtools tools. If the page offers its own tools, use them."

## What was checked, and what wasn't

### Verified

- The Inspector, version 1.9.20, from its installed source: it lists tools with `document.modelContext.getTools()`, follows `toolchange`, runs tools with `document.modelContext.executeTool()`, and sends Gemini each tool's name, description, `inputSchema` and `outputSchema`, without annotations. Its chat loop waits for each tool's result before it continues. Its models are `gemini-3-flash-preview`, `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.5-flash` and `gemini-3.6-flash`, the default.

#### Chrome DevTools MCP, verified on 15 Nov 2026

Driven by a small Node script that spoke JSON-RPC to the server over stdio. No model and no MCP client app was involved.

- `npx -y chrome-devtools-mcp@latest` resolved to **1.13.0**. The server reports itself as `chrome_devtools` 1.13.0 and accepted `initialize` with protocol version `2025-06-18`.
- Flag names, from `--help`: `--categoryExperimentalWebmcp`, `--browserUrl`, `--executablePath`, `--chromeArg`, `--headless`, `--isolated`, `--no-usage-statistics`, `--no-javascript-evaluation`, `--no-performance-crux`.
- Without `--categoryExperimentalWebmcp`: 33 tools, including `take_snapshot`, `click`, `fill`, `fill_form`, `navigate_page`, `new_page`, `list_pages`, `wait_for`, `evaluate_script`. With it: 35, adding `list_webmcp_tools` and `execute_webmcp_tool`.
- Both tools need a `pageId` (from `new_page` or `list_pages`). `execute_webmcp_tool` takes `toolName` and `input`, a JSON string.
- With the flag on, `new_page`, `navigate_page` and `list_pages` also print the page's WebMCP tools.
- Chrome for Testing 157.0.8103.78 launched by the server (`--executablePath`, `--chromeArg=--enable-features=WebMCP,DevToolsWebMCPSupport`, headless), and a Chrome for Testing started separately with `--remote-debugging-port` and reached with `--browserUrl`: both worked. Stable Chrome 157.0.8103.51, launched headless by the server with `--chromeArg=--enable-features=WebMCP` and `--no-javascript-evaluation`, also listed and ran the tools.
- On the finished app: five tools signed out; after clicking **Continue as Asha Rao (demo shopper)** through the server's `click`, eight. Calling `get_delivery_slots` while signed out returned `Error: Tool get_delivery_slots not found`.
- The whole task through `execute_webmcp_tool`: `search_products` returned hp-103, hp-102, hp-101, hp-107; `add_to_cart` with `purple` returned the "comes in black, silver" error; with `black`, "total ₹4,799"; `apply_coupon` returned "₹480 off. The total is now ₹4,319"; `get_delivery_slots` returned four slots, earliest first; `place_order` waited until the dialog's **Place order · ₹4,319** button was clicked, then returned "Order NB-1001 is placed: ₹4,319, pay on delivery, arriving Tomorrow, 16 Nov, 9 am to 12 pm."
- The DevTools WebMCP pane, checked by loading the DevTools frontend against the shop in a headless Chrome for Testing 157.0.8103.78: **Application > WebMCP** is there with only `--enable-features=WebMCP` (no `DevToolsWebMCPSupport`). It has a "Tool activity" log, an "Available tools" list, and for a selected tool its details with **Add parameter** and **Run tool**.
- While `place_order` waited, a `take_snapshot` sent to the same server did not return either (both timed out after 40 seconds with nobody clicking). The server runs one tool call at a time.

### Not verified

- Gemini in the Inspector against the shop. Nobody ran a model against Namma Bazaar while writing this: do the dry run.
- That the Inspector keeps waiting while the confirmation dialog is open for a long time. Click the dialog within a few seconds.
- Claude Code, Codex and Antigravity with the Chrome DevTools MCP configs above, and Antigravity's config path, which comes from Google's codelab.
