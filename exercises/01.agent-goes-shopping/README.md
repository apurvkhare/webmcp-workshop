# 1 An agent goes shopping

No code in this section. You watch one task done twice: by an agent that drives the shop's UI, and by an agent that calls the shop's tools. Then you look at what each of them had to read.

The task:

> Find wireless headphones under ₹5,000 rated 4 or higher, add the best-rated one that comes in black to the cart, apply the coupon DEVFEST10, and order it to my saved address in the earliest delivery slot.

## Run it

```bash
npm start -- --app app
```

Open <http://localhost:5173>. This is the finished shop, with every tool from the workshop. The workshop drawer is on the right. If it is closed, the **Workshop** button at the right edge of the page opens it.

## Follow along

1. **Do it by hand once.** Search, filter, open a product, pick the colour, add it, apply the coupon, sign in, check out. Count your clicks. Then press **Reset demo data** in the drawer.
2. **Open the Agent view tab.** The top half shows what an agent has to read on this page: the page as text, the way a UI-driving agent receives it, next to the list of tools. Both have a size. Go to another page and watch the first number change and the second stay put.
3. **Press Shop by clicking.** A script does the task through the UI, the way a UI-driving agent would: read the page, find the element, act, read the page again. Each step is highlighted as it happens.
4. **Press Shop with tools.** A script does the same task by calling tools. When the dialog asks you to confirm the order, confirm it. An agent can't press that button.
5. **Compare.** The table has the steps and the amount of text read for each run.

📡 While the tools run, keep DevTools > **Application** > **WebMCP** open, or the drawer's **Activity** tab. Each call appears with its input and its result.

On the projector, the presenter does the same with a real agent. The runbook is in [demo/README.md](../../demo/README.md).

## 🧠 What to take from it

- **Both runs end with the same order.** WebMCP doesn't make something possible that wasn't. It changes how much the agent has to read, how many steps it takes, and how much can go wrong on the way.
- **The clicking run depends on the page.** Move a button, rename a label, add a banner, and it may break. The tool run depends on a contract: a name, a description and a schema.
- **The tools run in the page, as the shopper.** Same session, same cookie, same server rules. No API key, no second backend.
- **The shopper is still there.** The page follows the agent, and the order waits for a person to confirm it.
- **The replay is a script, not a model.** It shows the shape of the two approaches. Its numbers are not a benchmark: a real agent takes more steps both ways, and how many depends on the model.

## Explain it back

1. In the clicking run, what did the agent have to read before it could add the product to the cart? In the tools run?
2. Whose session did the tool calls use? Where did the code that placed the order run?
3. Which step in the tools run could the script not do by itself, and why is that a good thing?

**Next:** stop the server with Ctrl+C, then `npm run go 2.1` and `npm start`.
