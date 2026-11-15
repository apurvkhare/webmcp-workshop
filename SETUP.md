# Setup

Do this before the workshop, on a network you trust. It takes about 10 minutes. After it, the workshop runs offline.

## You need

- **Chrome 155 or later.** Check at `chrome://version`. Update at `chrome://settings/help`, then relaunch. Chrome Beta or Canary work too.
- **Node 20.19 or later.** Check with `node --version`. Install the LTS from [nodejs.org](https://nodejs.org), or with `nvm install 22`.
- **git**, to clone the repo.
- **Port 5173 free.** The shop runs there.
- **A code editor.**
- **An AI coding agent, optional.** Claude Code, GitHub Copilot, Cursor, Codex, Antigravity or any other. The exercises work with or without one.

No accounts and no API keys. Nothing in the workshop calls a model: you call the tools yourself, from DevTools or from the workshop drawer in the page.

## Turn WebMCP on in Chrome

WebMCP is behind a flag. On `localhost`, the flag is all you need.

1. Open `chrome://flags/#enable-webmcp-testing` and set it to **Enabled**.
2. Open `chrome://flags/#devtools-webmcp-support`. If the flag is listed, set it to **Enabled** too. It adds the WebMCP pane to DevTools. If it isn't listed, your Chrome has the pane already.
3. Press **Relaunch**.

Check it: open DevTools on any page, and in the Console run:

```js
'modelContext' in document
```

It should print `true`.

## Install

```bash
git clone https://github.com/apurvkhare/webmcp-workshop.git
cd webmcp-workshop
npm install
npm run doctor
```

`doctor` checks your Node version, the dependencies, the port, your Chrome version, and runs the finished app's tests. Every line should show ✓. Each ✗ says what to do. It can't see your Chrome flags: the next step checks those.

npm may print audit and deprecation warnings. They come from dev tools, and `doctor` passing means you can ignore them.

## Try it once

```bash
npm start -- --app app
```

Open <http://localhost:5173>. You should see Namma Bazaar, an online shop.

1. The **workshop drawer** is on the right of the page. If it is closed, the **Workshop** button at the right edge opens it. Next to its title is a green badge: **5 tools**.
2. Open the **Tools** tab. It lists the five tools.
3. Open `search_products`, and run it with `{ "query": "headphones" }`. Products come back as JSON, and the shop moves to the search results.
4. Open DevTools > **Application** > **WebMCP**. The same five tools are listed there.

Press `Ctrl+C` in the terminal to stop.

## If something is wrong

| What you see | What to do |
|---|---|
| The drawer's badge says **WebMCP off** | The flag isn't on, or Chrome is older than 155. Do "Turn WebMCP on in Chrome" again, and use the **Relaunch** button: closing one window isn't enough |
| `'modelContext' in document` is `false`, but `'modelContext' in navigator` is `true` | Chrome is older than 152, where the API lived on `navigator`. Update Chrome |
| Running a tool fails with a `TypeError` about its input | Chrome is older than 155, where `executeTool` took a JSON string. Update Chrome |
| No **WebMCP** entry in DevTools > Application | Enable `chrome://flags/#devtools-webmcp-support` and relaunch. Or skip it: the drawer's Tools tab shows the same list and runs the same calls |
| The flags page is blocked, or Chrome is managed by your employer | Install Chrome Beta or Canary next to it. Or use a Chrome for Testing: see below |
| `npm start` says port 5173 is in use | Stop the other process, or run `npm start -- --port 5174` and use that port in every URL |
| `npm start` or `npm test` fails right after cloning | Run `npm run doctor` and follow its ✗ lines |
| The page is blank | Look at the terminal where `npm start` runs, and at the Console in DevTools. A syntax error in `playground/` shows in both |
| A tool you just wrote isn't in the list | Save the file and wait for the page to reload. Then check the Console: `registerTool` rejects a duplicate name, a name with spaces, and an empty description |
| The shop's data is in a strange state | Press **Reset demo data** in the drawer. It signs you out, empties the cart and forgets the orders |

### A Chrome for Testing, if you can't change flags

This downloads a separate Chrome into the repo, and starts it with WebMCP on from the command line. It doesn't touch your own Chrome.

```bash
npx @puppeteer/browsers install chrome@stable --path .chrome
```

The command prints the path of the binary it installed. Start that binary with:

```
--enable-features=WebMCP,DevToolsWebMCPSupport
```

On macOS, for example:

```bash
"$(find .chrome -name 'Google Chrome for Testing' -type f | head -1)" --enable-features=WebMCP,DevToolsWebMCPSupport http://localhost:5173
```

## Not needed on localhost: the origin trial

A flag only changes your own browser. To give WebMCP to real users on a deployed site, you register for Chrome's **WebMCP origin trial** and put its token in the page. That is in [GOING-FURTHER.md](GOING-FURTHER.md). Nothing in the workshop needs it.

## If you'll use an agent

Open the repo in it once before the day, so it picks up `AGENTS.md`. That file keeps the agent to one step at a time, and has it explain its code. Try `/step 2.1` (Claude Code) or "do step 2.1" in any other agent, then reset with `npm run go 2.1`.

## Before you leave home

- [ ] `chrome://version` says 155 or later
- [ ] `'modelContext' in document` prints `true`
- [ ] `npm run doctor` passes
- [ ] The drawer at localhost:5173 has a green **5 tools** badge
- [ ] Laptop charger
