/**
 * Observability: every tool call leaves a line in the agent log.
 * The catalogue, cart and order tools are already registered through withLogging. Until you write it, it changes nothing.
 */
import type { AgentLog } from '@shop';

/** Returns the same tool, with an execute that records each call: which tool, the input, how long it took and how it ended. */
export function withLogging(tool: ModelContextTool, log: AgentLog): ModelContextTool {
  // 🔨 6.1 Return a copy of the tool whose execute calls the original, records what happened, and passes the result on.
  // 💡 return { ...tool, async execute(input, options) { … } };
  // 💡 Inside: note performance.now(), then const result = await tool.execute(input, options);
  // 💡 log.record({ tool: tool.name, input, outcome, ms, result }). outcome is 'error' when the result starts with "Error:", otherwise 'ok'.
  // 💡 In a catch: record outcome 'threw' with String(error), then throw the error again. Logging must not change what the agent gets.
  // 🧠 The page is the only place that sees every agent call. Your server sees API requests, and can't tell an agent's from a person's.
  // 🧠 Inputs can hold personal data. In production, choose what you log.
  // 📡 Run a few tools, then open the drawer's Activity tab, and look at the terminal where npm start is running.
  // 🧪 Each call logs one line with tool, input, outcome and ms. An "Error:" answer is 'error'. A throw is 'threw' and still throws.
  return tool;
}
