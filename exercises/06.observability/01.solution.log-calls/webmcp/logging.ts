/**
 * Observability: every tool call leaves a line in the agent log.
 * The catalogue, cart and order tools are already registered through withLogging. Until you write it, it changes nothing.
 */
import type { AgentLog } from '@shop';

/** Returns the same tool, with an execute that records each call: which tool, the input, how long it took and how it ended. */
export function withLogging(tool: ModelContextTool, log: AgentLog): ModelContextTool {
  return {
    ...tool,
    async execute(input, options) {
      const started = performance.now();
      const ms = () => Math.round(performance.now() - started);
      try {
        const result = await tool.execute(input, options);
        const text = typeof result === 'string' ? result : JSON.stringify(result);
        log.record({ tool: tool.name, input, outcome: text.startsWith('Error:') ? 'error' : 'ok', ms: ms(), result: text });
        return result;
      } catch (error) {
        log.record({ tool: tool.name, input, outcome: 'threw', ms: ms(), result: String(error) });
        throw error;
      }
    }
  };
}
