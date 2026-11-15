# ✅ 6.1 Log every tool call

This folder is the finished step. Every ✅ comment in the code marks work from this step or an earlier one. It is also the last step: this is the same code as `app/`.

**What was built:** `withLogging(tool, log)` returns a copy of a tool whose `execute` records the tool, input, duration and outcome of each call, and passes the result on unchanged.

**Where:** `webmcp/logging.ts`: the 6.1 change.

**📡 What to look for:** Run a few tools. The drawer's Activity tab lists each call, and the terminal where `npm start` runs prints a 🤖 line for each.

## Explain it back

1. Why can't the server tell an agent's request from a person's?
2. What are the three outcomes, and how does the wrapper tell `'ok'` from `'error'`?
3. What would go wrong for `place_order` if the wrapper didn't pass `options` on?

**Next:** section 7. Open the drawer's **Agent view** tab and press **Shop with tools**.
