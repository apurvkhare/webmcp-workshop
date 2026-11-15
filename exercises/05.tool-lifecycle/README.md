# 5 Tools follow state

The list of tools is not fixed. It is a description of what can be done on this page, right now, by this user. When that changes, the list should change with it.

| Step | You write | Where |
|---|---|---|
| 5.1 | The order tools registered at sign-in with an `AbortSignal`, and removed by aborting it at sign-out | `webmcp/index.ts`, `webmcp/order-tools.ts` |

There is no `unregisterTool()`. A tool is registered with a signal, and it lives until that signal aborts:

```
 sign in  ──▶ controller = new AbortController()
              registerTool(tool, { signal: controller.signal })   × 3
 sign out ──▶ controller.abort()                                  all three are gone
```

Start with `npm run go 5.1`.
