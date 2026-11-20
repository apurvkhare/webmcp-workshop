# 7 Replay and ship

No code in this section. You run the opening task again, this time with the tools you wrote, and then look at what it takes to put this on a real site.

## Replay it

Your playground should be on step 6.1 with every test passing:

```bash
npm run status
```

With `npm start` running, open the drawer's **Agent view** tab and press **Shop with tools**. Confirm the order when the dialog asks.

Each line of the run is a step you wrote:

| The run does | You wrote it in |
|---|---|
| `search_products` with a query, a price and a rating | 2.1 |
| `add_to_cart` with the id and the colour | 2.2 |
| `apply_coupon` | given |
| `get_delivery_slots`, only there because the script signed in first | 5.1 |
| `place_order`, which waits for you | 4.2 |
| A line for each call in the Activity tab and the terminal | 6.1 |

If the run stops early, it says which tool it couldn't find. `npm run status` tells you which step that is.

## Compare it with section 1

In section 1 your agent did this task by reading and clicking the page. Now put the two side by side:

1. **Look at the top of the Agent view tab.** It shows what an agent has to read on this page: the page as text, next to the list of tools. Both have a size. Go to another page and watch the first number change and the second stay put.
2. **Press Shop by clicking.** A script does the task through the UI, the way your agent did. Each step is highlighted as it happens.
3. **Press Shop with tools** again, and read the table. It has the steps and the amount of text read for each run.
4. **Hold it against your agent's step list from section 1.** The replay is a script, not a model, so its numbers are not a benchmark. A real agent takes more steps both ways.

Both runs end with the same order. WebMCP doesn't make something possible that wasn't. It changes how much the agent reads, how many steps it takes, how much can go wrong on the way, and who confirms the order.

## Try to break it

- In the Tools tab, run `place_order` and press **Not now**. Read what the agent is told.
- Sign out and look at the tool list.
- Run `get_reviews` for `hp-102` and find the review that isn't for you.
- Turn the flag off at `chrome://flags/#enable-webmcp-testing`, relaunch, and use the shop. Nothing is broken: `setupWebMCP` returns early, and the page is an ordinary shop. Turn the flag back on.

## Ship it

The [production checklist](../../PRODUCTION-CHECKLIST.md) is the handout. The short version:

- **Feature-detect.** `if (!('modelContext' in document)) return;` The site must work without WebMCP: most browsers don't have it.
- **A tool is a way into code the user can already run.** It adds no permission. The server authorises every request as before.
- **Validate in `execute`.** Chrome doesn't. Return errors as text the agent can act on.
- **Ask in the page before anything that costs money or can't be undone.** Annotations are hints.
- **Keep the tool list true.** Register with a signal, abort it when the state changes.
- **Log calls in the page.** Nothing else can tell an agent from a person.
- **It is an origin trial.** Chrome only, behind a flag or a token, until at least Chrome 162. The API has changed shape before and may again. Read the spec before each release.

## Where to go next

[GOING-FURTHER.md](../../GOING-FURTHER.md) has what didn't fit: a real model calling your tools from the Model Context Tool Inspector, automated agent tests with Chrome DevTools MCP, tools in cross-origin iframes, the W3C polyfill for other browsers, and deploying with an origin trial token.

## Explain it back

1. Which of your tools would you ship as they are, and which would you change first?
2. What does a user of Firefox or Safari see on a site that has WebMCP tools?
3. What would you check in the spec before your next release, and why?
