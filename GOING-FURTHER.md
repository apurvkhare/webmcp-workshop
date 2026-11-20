# Going further

What didn't fit in the workshop. Each section says what it is, when you'd want it, and the smallest thing that works.

Some of this was run while writing the workshop, some wasn't. Anything marked **Not verified here** comes from Chrome's docs, the spec or the tools' own READMEs, and nobody ran it for this repo. Check it before you rely on it.

## Talk to your tools: the Model Context Tool Inspector

**What it is.** A Chrome extension, "WebMCP - Model Context Tool Inspector", by François Beaufort of Chrome DevRel (not an official Google product). It opens in the side panel, lists the page's tools with their annotations, lets you run one with JSON input, and lets you chat with Gemini, which can call the tools.

**When you'd want it.** To see whether a model picks the right tool from your names and descriptions. The DevTools WebMCP pane runs tools, but it isn't an agent.

**How.**

1. Chrome 155 or later, with `chrome://flags/#enable-webmcp-testing` on.
2. Install it from the Chrome Web Store: https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd
3. Get a Gemini API key at https://aistudio.google.com, in your own project.
4. Start the finished shop and open it:

```bash
npm start -- --app app
```

5. Open the extension's side panel on http://localhost:5173, press **Set Gemini API key**, paste the key.
6. Type the opening task: "Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot." Sign in as Asha first.

To run a tool by hand, the input must be valid JSON, for example `{"query": "wireless headphones", "maxPrice": 5000}`.

Know what you're sending: your prompt, the tool definitions and the tool results go to Google's Gemini API, from your browser. On the free tier, Google may use that data to improve its products. The key is kept in the extension's `localStorage`. Rate limits are per project, so don't share one key across a room.

**Not verified here.** Nobody ran the extension against Namma Bazaar. The default model (`gemini-3.6-flash` according to its source) and its free-tier limits may have changed.

## Test with an agent's tools: Chrome DevTools MCP

**What it is.** Chrome DevTools MCP is an MCP server that lets an MCP client drive Chrome: snapshots, clicks, network, performance. With `--categoryExperimentalWebmcp` it adds two tools, `list_webmcp_tools` and `execute_webmcp_tool`, which call your page's WebMCP tools the way an agent would.

**When you'd want it.** Two cases. In CI, to check that your tools are registered and answer correctly in real Chrome, through the same path an agent uses, with no model. And by hand, to point Claude Code or Gemini CLI at your page and give it a task, which is what the section 1 demo does ([demo/README.md](demo/README.md) has the configs).

**How.** The script below starts the server over stdio, opens the shop, lists the tools and calls two of them. It speaks plain JSON-RPC, so it needs nothing installed but Node. Start the shop first:

```bash
npm start -- --app app --port 5174
```

Save this as `agent-test.mjs`, outside `exercises/` and `playground/`:

```js
// agent-test.mjs: call the shop's WebMCP tools through Chrome DevTools MCP, no model involved.
// Run with the shop already started: node agent-test.mjs http://localhost:5174
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import assert from 'node:assert/strict';

const SHOP = process.argv[2] ?? 'http://localhost:5174';
const server = spawn('npx', [
  '-y', 'chrome-devtools-mcp@1.13.0',
  '--headless', '--isolated', '--no-usage-statistics', '--no-javascript-evaluation',
  '--categoryExperimentalWebmcp',
  '--chromeArg=--enable-features=WebMCP',
  ...(process.env.CHROME_PATH ? ['--executablePath', process.env.CHROME_PATH] : [])
], { stdio: ['pipe', 'pipe', 'inherit'] });

let nextId = 0;
const waiting = new Map();
createInterface({ input: server.stdout }).on('line', (line) => {
  const message = JSON.parse(line);
  waiting.get(message.id)?.(message);
});
const request = (method, params) =>
  new Promise((resolve) => {
    const id = ++nextId;
    waiting.set(id, resolve);
    server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
const callTool = async (name, args) => {
  const { result } = await request('tools/call', { name, arguments: args });
  return result.content.map((c) => c.text).join('\n');
};

try {
  await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'agent-test', version: '1' } });
  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  await callTool('new_page', { url: `${SHOP}/?drawer=off` });
  const pageId = Number(/^(\d+): .*\[selected\]$/m.exec(await callTool('list_pages', {}))[1]);

  const tools = await callTool('list_webmcp_tools', { pageId });
  assert.match(tools, /name="search_products"/);

  const found = await callTool('execute_webmcp_tool', {
    pageId,
    toolName: 'search_products',
    input: JSON.stringify({ query: 'wireless headphones', maxPrice: 5000, minRating: 4 })
  });
  assert.match(found, /"hp-102"/);

  const wrongColour = await callTool('execute_webmcp_tool', {
    pageId,
    toolName: 'add_to_cart',
    input: JSON.stringify({ productId: 'hp-102', colour: 'purple' })
  });
  assert.match(wrongColour, /comes in black, silver/);
  console.log('ok: the tools answer as expected');
} finally {
  server.kill();
}
```

```bash
node agent-test.mjs http://localhost:5174
```

It uses your installed Chrome (stable channel). To use the repo's Chrome for Testing instead, set `CHROME_PATH` to its binary.

Things to know, all seen on 15 Nov 2026 with version 1.13.0:

- Both WebMCP tools need a `pageId`, which `new_page` and `list_pages` print.
- `input` is a JSON **string**, not an object.
- The result is `{ "status": "Completed", "output": … }`. An error your tool returns as text also comes back as `Completed`; check the output, not the status.
- A tool that isn't registered (say `get_delivery_slots` while signed out) gives `Error: Tool get_delivery_slots not found`.
- The server runs one tool call at a time. A call that waits for a person, like `place_order` and its dialog, blocks every call after it. In a headless test nobody can click, so test confirmation flows with the unit-test double or puppeteer, as `npm run verify:chrome` does.
- Usage statistics are on by default; `--no-usage-statistics` turns them off.

**Verified here** with Chrome DevTools MCP 1.13.0, against stable Chrome 157.0.8103.51 and Chrome for Testing 157.0.8103.78.

## An agent in the page: the Prompt API (Gemini Nano)

**What it is.** Chrome's Prompt API runs Gemini Nano on the device: no server, no API key, nothing leaves the laptop. Chrome's WebMCP docs say tool use with it needs `chrome://flags/#prompt-api-tool-use`. Chrome's Example Agentic Extension (https://github.com/GoogleChromeLabs/webmcp-extension) can use it: Settings › Model › On-device model.

**When you'd want it.** Privacy-sensitive pages, offline use, or a demo with no key.

**Why it isn't in the workshop.** The model needs at least 22 GB free on the disk that holds your Chrome profile, and either a GPU with more than 4 GB of VRAM or 16 GB of RAM and 4 CPU cores. It downloads several gigabytes on first use, which conference Wi-Fi won't do for a room. Many laptops in a mixed room don't qualify. And a small model chooses tools less reliably than a large one.

**How.** The smallest version: give the model the tool list, ask it for one tool call as JSON, and run it.

```js
const tools = await document.modelContext.getTools();
if ((await LanguageModel.availability()) !== 'available') throw new Error('Gemini Nano is not ready on this device.');

const session = await LanguageModel.create({
  initialPrompts: [{
    role: 'system',
    content: 'Choose one tool for the request and its input. Tools:\n' +
      tools.map((t) => `${t.name}: ${t.description} Input: ${JSON.stringify(t.inputSchema ?? {})}`).join('\n')
  }]
});
const choice = JSON.parse(await session.prompt('Find wireless headphones under 5000 rupees', {
  responseConstraint: {
    type: 'object',
    properties: { tool: { type: 'string', enum: tools.map((t) => t.name) }, input: { type: 'object' } },
    required: ['tool', 'input']
  }
}));
const result = await document.modelContext.executeTool(tools.find((t) => t.name === choice.tool), choice.input);
```

A real agent loops: it sends the result back to the model and asks for the next call, and stops at a tool with `consequentialHint` to ask the person.

**Not verified here.** Nobody ran the Prompt API, this snippet or the extension for this repo. The hardware numbers are from Chrome's Prompt API docs; `prompt-api-tool-use` is a flag-only experiment.

## Tools in a cross-origin iframe

**What it is.** A widget from another origin (a payment form, a chat box, a map) registers its own tools, and the page that embeds it can see and call them.

**When you'd want it.** Your checkout embeds a payment provider's iframe, or you ship a widget that other sites embed.

**How.** It takes an opt-in on three sides.

The embedding page lets the iframe register tools, with the `tools` permission:

```html
<iframe src="https://widget.example/pay" allow="tools"></iframe>
```

Inside the iframe, the widget names the origins that may see its tool:

```js
await document.modelContext.registerTool(payTool, { exposedTo: ['https://shop.example'] });
```

The embedding page asks for tools from that origin, then calls one. It runs in the iframe:

```js
const tools = await document.modelContext.getTools({ fromOrigins: ['https://widget.example'] });
await document.modelContext.executeTool(tools.find((t) => t.name === 'pay'), { amount: 4319 });
```

Without `allow="tools"`, `registerTool()` in the iframe rejects with `NotAllowedError`. Without `exposedTo`, a tool is visible to its own origin only; without `fromOrigins`, `getTools()` returns same-origin tools only. `Permissions-Policy: tools=()` on a response turns tools off for that document. Origins must be secure (https, or localhost).

**Not verified here.** In Chrome 157 the probe saw that `registerTool` takes `exposedTo` and `getTools` takes `fromOrigins`. Nobody ran a cross-origin iframe.

## Ship it: the origin trial

**What it is.** WebMCP is off by default in Chrome. On your own laptop the flag turns it on. For your users, your site needs an origin trial token. The trial is called "WebMCP"; it started in Chrome 149 and has been extended to Chrome 162.

**When you'd want it.** To let real visitors' agents use your tools, and to give Chrome feedback while the API can still change.

**How.**

1. Register your origin: https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241
2. Put the token in the `<head>` of every page that registers tools:

```html
<meta http-equiv="origin-trial" content="YOUR_TOKEN">
```

or send it as a response header:

```text
Origin-Trial: YOUR_TOKEN
```

3. Keep the feature check, `if (!('modelContext' in document)) return;`, for browsers without the trial.
4. Note the trial's end date from the console, and re-read the spec before each release. [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) has the rest.

The trial supports third-party tokens, for a script you serve to other sites; those are injected by that external script. The page must be a secure context.

**Not verified here.** Nobody registered a token or tried one. Whether a token can be issued for localhost isn't documented for this trial: use the flag locally.

## `title` and `outputSchema`

**What they are.** Two optional fields on a tool. `title` is a short name for people, for browser UI; the name is for the agent. `outputSchema` is a JSON Schema for what the tool returns, so an agent knows the shape before it calls. Both are 🔥 bonuses in step 2.1. On a form tool, `tooltitle` sets the title.

**When you'd want them.** `title` when a browser or extension shows your tools to the person. `outputSchema` when the result is JSON the agent will read fields from.

**How.**

```js
await document.modelContext.registerTool({
  name: 'search_products',
  title: 'Search products',
  description: 'Search the Namma Bazaar catalogue. Returns up to 8 products as JSON.',
  inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  outputSchema: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' }, name: { type: 'string' }, price: { type: 'number' },
        rating: { type: 'number' }, colours: { type: 'array', items: { type: 'string' } }, inStock: { type: 'boolean' }
      }
    }
  },
  annotations: { readOnlyHint: true },
  async execute(input) { /* … */ return JSON.stringify(products); }
});
```

```html
<form toolname="set_delivery_address" tooltitle="Delivery address" tooldescription="…">
```

The result is still text: return the JSON as a string that matches the schema. Chrome doesn't check it at run time. The DevTools WebMCP pane is documented to show an error when a return value doesn't match the schema.

**Partly verified here.** In Chrome 157, `getTools()` returns `title` as `""` when a tool has none. Nobody checked how browser UI uses `title`, or the WebMCP pane's schema errors.
