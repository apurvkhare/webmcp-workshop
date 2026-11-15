# 6 See what agents do

Your server sees API requests. It can't tell whether a person clicked or an agent called a tool: both are the same `fetch` with the same cookie. The page is the only place that knows. So the page logs.

| Step | You write | Where |
|---|---|---|
| 6.1 | `withLogging(tool, log)`: a wrapper that records each call's tool, input, duration and outcome | `webmcp/logging.ts` |

By the end, every tool call shows up in the drawer's **Activity** tab and in the terminal where `npm start` runs.

```
 agent ── executeTool ─▶ withLogging(tool).execute ─▶ tool.execute ─▶ result
                                   │
                                   └─▶ shop.log.record({ tool, input, outcome, ms })
                                          ├─▶ the Activity tab
                                          └─▶ POST /api/agent-log ─▶ the terminal
```

Start with `npm run go 6.1`.
