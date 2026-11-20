# 1 An agent goes shopping

No code in this section. Before you write any WebMCP, see how an agent does a shopping task today: by reading the page and clicking it. You give your own agent the task, and you ask it to tell you every step it took.

The task:

> Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot.

## Run it

```bash
npm run go 2.1
```

```bash
npm start
```

If you did the setup check in the room, this is already running. Step 2.1's starting code registers no tools, so this is the shop as it is today, without WebMCP: the drawer says **0 tools**. Open <http://localhost:5173/?drawer=off>. `?drawer=off` hides the workshop drawer, so the agent sees only the shop. `?drawer=on` brings it back.

## Give your agent the task

Use any agent that can drive a browser: Antigravity's browser agent, Claude Code or Codex with Chrome DevTools MCP or Claude in Chrome, or another. The setup for each is in [demo/README.md](../../demo/README.md#with-a-coding-agent-instead). Give it this:

```text
Open http://localhost:5173/?drawer=off in the browser and do this task on the page:

Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot.

Use only the browser. Don't read this project's code and don't call the shop's API.

When you're done, list every step you took, numbered: each time you read the page, and each click, key press or text you typed. Say where you had to look for something, guess or try again. Then give the totals.
```

The answer, to check it against: Tarang Studio Pro Wireless Headphones in black, ₹4,319 after the coupon, order **NB-1001**. Before you try again, reset the shop: open <http://localhost:5173/?drawer=on> and press **Reset demo data** in the drawer, or run `curl -X POST http://localhost:5173/api/dev/reset`.

No agent with a browser? Do the task by hand and count your clicks, then watch the presenter's run. A recording of one, with its step list, is in [demo/recordings](../../demo/recordings/agent-without-webmcp.md).

## Read what it tells you

- **How did it see the page?** Screenshots read by a vision model, the HTML DOM, or the accessibility tree (roles, names and states). Most agents mix them. The recording used screenshots 14 times and the accessibility tree once, and never read the HTML.
- **How many steps, and how many of them were reading?** Every action is followed by a read, because the agent can't know what changed.
- **Where did it have to look?** The coupon box is collapsed. Checkout sends you to sign in first. The results show colour dots, not names.
- **What did it read that wasn't for it?** One review on the black headphones is written to AI assistants.
- **Who confirmed the order?** Nothing in the page knows an agent is there, so nothing stops it at Place order.

On the projector, the presenter runs an agent the same way, or plays the recording. Keep your agent's step list: in section 7 you run the same task again, with the tools you wrote.

## 🧠 What to take from it

- **An agent can already use your site.** It does it the way a person would, through the page, with no help from you.
- **It pays for that in reading.** Each step is a screenshot or a page read, and most of what it reads isn't what it needs.
- **It depends on the page.** Move a button, rename a label, add a banner, and it may break. With WebMCP the agent depends on a contract instead: a name, a description and a schema. That is what you write from section 2 on.
- **The page can't tell it from a person.** So it can't ask the shopper before the order goes out, or log what the agent did.

## Explain it back

1. How many steps did your agent take, and how many of them were reads?
2. Where did it have to search, guess or go back?
3. Which step should it not have done without asking you, and why couldn't the page stop it?

**Next:** step 2.1 is already in your playground. Read `playground/README.md`. `npm start` keeps running.
