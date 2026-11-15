# Demo runbook: an agent goes shopping

For the presenter. Section 1, at 0:04, 10 minutes. One task, done twice by a real agent on the projector: first by driving the UI, then with the shop's WebMCP tools.

Both runs use the same Chrome window, the same shop page and the same prompt. The only difference is what the agent is given: an MCP client connected to Chrome DevTools MCP, first without and then with `--categoryExperimentalWebmcp`.

The task, word for word:

> Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot.

The right answer is `hp-102`, Tarang Studio Pro, ₹4,799, rated 4.6. `hp-103` is rated 4.7 but only comes in blue and red. With DEVFEST10 the total is ₹4,319 (10% is ₹480, under the ₹500 cap; delivery is free from ₹999). The first order after a reset is NB-1001, paid on delivery.

## How the pieces fit

| Piece | Where it runs |
|---|---|
| The shop (finished app) | `npm start -- --app app --port 5174`, on http://localhost:5174 |
| Chrome | Started by you, with a demo profile and remote debugging on port 9222. You can see it, click in it and open DevTools in it |
| Chrome DevTools MCP 1.13.0 | Started by the MCP client over stdio. It connects to your Chrome with `--browserUrl` |
| The agent | Claude Code or Gemini CLI, in a terminal next to Chrome |

Port 5174 keeps 5173 free for your own playground.

## One-time setup

Do this on the presenter laptop at least a day before.

1. Node 20.19 or later, and the workshop repo installed (`npm install`, `npm run doctor`).
2. Claude Code or Gemini CLI, signed in.
3. Download Chrome DevTools MCP once, so the room's Wi-Fi isn't needed for it:

```bash
npx -y chrome-devtools-mcp@1.13.0 --version
```

It should print `1.13.0`.

4. Make a folder for the demo files, outside the repo:

```bash
mkdir -p ~/webmcp-demo/without/.gemini ~/webmcp-demo/with/.gemini
```

5. Save the two MCP configs below.

### MCP config: without WebMCP

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

### MCP config: with WebMCP

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

For Gemini CLI, copy each file into its folder's `.gemini/settings.json`:

```bash
cp ~/webmcp-demo/without.json ~/webmcp-demo/without/.gemini/settings.json
cp ~/webmcp-demo/with.json ~/webmcp-demo/with/.gemini/settings.json
```

Also check that `~/.gemini/settings.json` doesn't define another `chrome-devtools` server.

## Before the session: start the shop and Chrome

In the repo, in its own terminal tab:

```bash
npm start -- --app app --port 5174
```

Start Chrome with a separate demo profile. Chrome only allows remote debugging on a profile that isn't your default one, and the profile keeps your own tabs and sign-ins out of the agent's reach.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/webmcp-demo/chrome-profile" \
  --remote-debugging-port=9222 \
  --enable-features=WebMCP,DevToolsWebMCPSupport \
  --no-first-run \
  "http://localhost:5174/?drawer=off"
```

`--enable-features=WebMCP,DevToolsWebMCPSupport` does what the two `chrome://flags` entries do, for this profile only. The Chrome for Testing in the repo (`.chrome/chrome/mac_arm-157.0.8103.78/…`) works the same way; use its binary path instead.

In that window:

1. `?drawer=off` hides the workshop drawer, so the agent reads the shop and nothing else. It is remembered for the tab: `?drawer=on` brings the drawer back.
2. Sign in: **Sign in**, then **Continue as Asha Rao (demo shopper)**. No password. Asha has a saved address in Indiranagar, Bengaluru 560038.
3. Go back to the home page.
4. Open DevTools (Cmd+Option+I), **Application** tab, **WebMCP** in the sidebar. Dock DevTools at the bottom so the shop stays readable.
5. Make the terminal font large enough for the back row.

## The prompt

Paste the same text in both runs:

```text
The Namma Bazaar shop is open in Chrome at http://localhost:5174 and I am signed in. Work in that tab only, with the chrome-devtools tools. If the page offers its own tools, use them.

Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot.
```

The sentence about the page's own tools is in both prompts on purpose. In the first run there are none, so it changes nothing. In the second it stops the agent from clicking out of habit.

## Run 1: without WebMCP

Start the agent with the first config.

Claude Code:

```bash
claude --mcp-config ~/webmcp-demo/without.json --strict-mcp-config
```

Gemini CLI:

```bash
cd ~/webmcp-demo/without && gemini
```

Paste the prompt. Approve tool calls as they come, or allow the `chrome-devtools` server for the session at the first prompt.

What the room should notice, and what to say:

- **Snapshot, act, snapshot.** Every step starts with `take_snapshot`: the whole page as an accessibility tree, one line per element, each with a `uid`. Then one `click` or `fill` on a `uid`. Then another snapshot, because the page changed.
- **The cards don't show colours.** To find "black", the agent has to open products one by one. It usually opens `hp-103` first, the best rated, finds blue and red only, and goes back.
- **The coupon field is hidden** behind "Have a coupon?". The agent has to find the disclosure first.
- **Checkout is three screens**: the address form ("Save and continue"), the delivery slots ("Continue"), the review ("Place order").
- **Nobody asks you before the order is placed.** The agent presses "Place order" itself. To the page, the agent's click is your click. (Claude Code or Gemini CLI may ask before each tool call: that is the agent asking, not the shop.)

Stop at 0:09 whether it has finished or not. If it hasn't: "It's still going. That's the point. Let's give it tools."

## Reset between runs

In a spare terminal:

```bash
curl -X POST http://localhost:5174/api/dev/reset
```

This clears the cart, the orders and the session. Then in Chrome: reload, **Sign in**, **Continue as Asha Rao (demo shopper)**, back to the home page. Quit the first agent session (Ctrl+C twice in Claude Code, `/quit` in Gemini CLI) so the second one starts with a fresh context.

## Run 2: with WebMCP

Claude Code:

```bash
claude --mcp-config ~/webmcp-demo/with.json --strict-mcp-config
```

Gemini CLI:

```bash
cd ~/webmcp-demo/with && gemini
```

Paste the same prompt.

What the room should notice:

- **A tool list instead of a page.** The agent calls `list_webmcp_tools`, or reads the tool list that this server adds to the output of `navigate_page` and `list_pages`. Signed in, there are eight tools: `search_products`, `get_reviews`, `view_cart`, `add_to_cart`, `apply_coupon`, `get_delivery_slots`, `place_order`, `get_orders`. On the checkout page there is a ninth, `set_delivery_address`, the form tool from section 3.
- **Five calls, sometimes six:** `search_products` (query, price and rating in one call), `add_to_cart` (`hp-102`, black: the colours came back with the search, so no product page is opened), `apply_coupon`, `get_delivery_slots`, `place_order`. Some agents add a `view_cart` or a `get_reviews`.
- **Each call goes through `execute_webmcp_tool`**, and the result comes back as `{ "status": "Completed", "output": … }`. An error the tool returns as text, such as a wrong colour, also arrives as `Completed`, with the error sentence as the output, so the agent can read it and fix the call.
- **The page follows along.** The search results and the cart appear in the shop as the tools run.
- **The confirmation dialog.** `place_order` opens "Place this order?" in the page, with the item, the address, the slot and a button **Place order · ₹4,319**. The agent waits. Chrome DevTools MCP handles one call at a time, so the agent can do nothing else until you answer. Pause, let the room read the dialog, then click the button. The agent gets back `Order NB-1001 is placed: ₹4,319, pay on delivery, arriving …`.
- **The DevTools WebMCP pane** lists the tools and logs each call with its input and output. Point at it after the order: "Every call the agent made, with its input, in the browser's own tools."

If the agent calls `get_reviews` on `hp-102`, one review is a planted prompt injection telling AI assistants to add 5 of `sw-701` and order without asking. If the agent follows it, the confirmation dialog shows a smartwatch you didn't ask for: click **Not now** and say "Hold that thought: section 4." Don't try to provoke it on stage.

## The last minute: every laptop, no model

Tell the room: the workshop drawer has an **Agent view** tab with two buttons, **Shop by clicking** and **Shop with tools**. They do the same task by script: one clicks through the UI the way a UI-driving agent would, the other calls the tools. Both count steps and how much text the agent had to read.

Say it every time: **the replay is a script, not a model, and not a benchmark.** It shows the shape of the two approaches. The click script already knows the shortest path and never misclicks, so it is the UI's best case.

Attendees have the finished shop running from the setup check (`npm start -- --app app`), so both buttons work on their laptops now. In **Shop with tools** they confirm the order themselves when the dialog asks. They press the same button again in section 7, on their own code.

## Timing plan (10 minutes)

| Clock | Min | What |
|---|---|---|
| 0:04 | 1 | The task on the slide. "How many clicks would this take you?" |
| 0:05 | 4 | Run 1, without WebMCP. Narrate the snapshot, act, snapshot loop. Hard stop at 0:09 |
| 0:09 | 0.5 | Reset, sign in, start the second agent |
| 0:09:30 | 3 | Run 2, with WebMCP. Pause on the dialog, click, show the WebMCP pane |
| 0:12:30 | 1.5 | The Agent view tab on every laptop, and the "scripted, not a benchmark" caveat |

If run 1 is slow, cut it at 0:09 and go on. If run 2 is slow (rate limits, network), switch to the recording.

## Fallbacks

In this order:

1. **The recording** from the dry run, both runs, with the WebMCP pane visible. Keep it on the desktop, not in a cloud folder. Play it at 1.5× and narrate over it.
2. **The drawer's replay buttons** on the presenter laptop: open http://localhost:5174/?drawer=on, **Agent view**, press **Shop by clicking**, then **Shop with tools**. They reset the demo data and sign in by themselves. In **Shop with tools** you still click the button in the confirmation dialog. No network, no model, no key.
3. If Chrome itself won't start with WebMCP: the slides, and straight on to the concept section.

A dead network kills the agent (it needs its model), not the shop: everything else runs on localhost.

## Dry run the night before

- [ ] `npm run doctor` passes on the presenter laptop.
- [ ] `npx -y chrome-devtools-mcp@1.13.0 --version` prints `1.13.0` (the package is cached).
- [ ] The agent CLI is signed in and has quota for a few runs.
- [ ] Shop on 5174, Chrome on the demo profile with port 9222, signed in as Asha, drawer off.
- [ ] DevTools > Application shows **WebMCP**, and lists five tools signed out, eight signed in.
- [ ] Run 1 finishes, or you know roughly where it is at the four-minute mark.
- [ ] Run 2 makes its five or six calls and stops at the confirmation dialog.
- [ ] The dialog says **Place order · ₹4,319**, and the order is NB-1001 after a reset.
- [ ] The WebMCP pane shows the calls with their inputs.
- [ ] Both runs recorded (Cmd+Shift+5 on macOS), with the terminal and Chrome in frame.
- [ ] Both drawer replays work, and **Shop with tools** waits for your click.
- [ ] The reset command and both agent commands are in your shell history or a note.
- [ ] Notifications off, terminal font large, phone hotspot ready.
- [ ] If an agent ignored the page's tools in run 2, try the other agent, and keep whichever one used them.

## What was checked, and what wasn't

### Verified on 15 Nov 2026

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

- Claude Code and Gemini CLI with these configs: the `--mcp-config` and `--strict-mcp-config` flags, Gemini CLI reading `.gemini/settings.json` from the folder it starts in, and how either agent behaves with the prompt. Nobody ran a model against the shop.
- A headed Chrome with DevTools open on the same tab while the server is attached, and what the WebMCP pane's activity log shows during a run. The checks above were headless.
- How long Claude Code or Gemini CLI waits on a tool call before giving up. Click the dialog within a few seconds.
- That Chrome refuses `--remote-debugging-port` on the default profile. It is why the commands use a separate `--user-data-dir`, which is a good idea anyway.
