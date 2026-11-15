/**
 * A stand-in for document.modelContext, for tests. jsdom doesn't have WebMCP, and the tests have to run offline.
 * It follows the spec's IDL, and Chrome where the two differ (how results turn into text, the error names).
 */

export interface FakeModelContext extends ModelContext {
  /** The registered tools, execute functions included, in the order they were registered. */
  readonly registered: ModelContextTool[];
  /** The names of the registered tools, sorted, the way getTools() lists them. */
  names(): string[];
  tool(name: string): ModelContextTool | undefined;
  /** Calls a tool the way an agent does, and resolves with the text the agent would read. */
  call(name: string, input?: Record<string, unknown>, options?: ModelContextExecuteToolOptions): Promise<string>;
  /** Every event dispatched so far: "toolchange", "toolactivated:search_products", … */
  readonly events: string[];
}

const NAME = /^[A-Za-z0-9_.-]{1,128}$/;

class ToolEvent extends Event {
  readonly toolName: string;
  constructor(type: string, toolName: string) {
    super(type);
    this.toolName = toolName;
  }
}

/** What Chrome hands the agent for a given return value. */
export function resultText(result: unknown): string {
  if (typeof result === 'string') return result === '' ? 'Operation succeeded' : result;
  if (result !== null && typeof result === 'object') return JSON.stringify(result);
  return String(result);
}

export function createModelContext(): FakeModelContext {
  const target = new EventTarget();
  const registered: ModelContextTool[] = [];
  const events: string[] = [];
  const handlers: Partial<Record<'ontoolchange' | 'ontoolactivated' | 'ontoolcancel', ((event: never) => void) | null>> = {};

  const dispatch = (event: Event) => {
    events.push(event instanceof ToolEvent ? `${event.type}:${event.toolName}` : event.type);
    target.dispatchEvent(event);
    handlers[`on${event.type}` as keyof typeof handlers]?.(event as never);
  };
  const changed = () => queueMicrotask(() => dispatch(new Event('toolchange')));
  const reject = (name: string, message: string) => Promise.reject(new DOMException(message, name));

  const describe = (tool: ModelContextTool): RegisteredTool => ({
    name: tool.name,
    title: tool.title ?? '',
    description: tool.description,
    inputSchema: tool.inputSchema ? (JSON.parse(JSON.stringify(tool.inputSchema)) as JSONSchema) : undefined,
    outputSchema: tool.outputSchema ? (JSON.parse(JSON.stringify(tool.outputSchema)) as JSONSchema) : undefined,
    annotations: tool.annotations
      ? { readOnlyHint: false, untrustedContentHint: false, consequentialHint: false, debugging: false, ...tool.annotations }
      : undefined,
    origin: 'http://localhost',
    window
  });

  const context = {
    registered,
    events,
    names: () => registered.map((t) => t.name).sort(),
    tool: (name: string) => registered.find((t) => t.name === name),

    registerTool(tool: ModelContextTool, options: ModelContextRegisterToolOptions = {}) {
      if (!tool || typeof tool !== 'object') return Promise.reject(new TypeError('registerTool needs a tool object.'));
      if (typeof tool.name !== 'string' || !NAME.test(tool.name)) return reject('InvalidStateError', 'Invalid tool name');
      if (typeof tool.description !== 'string' || !tool.description) return reject('InvalidStateError', 'Description is required');
      if (typeof tool.execute !== 'function') return Promise.reject(new TypeError('The tool needs an execute function.'));
      if (registered.some((t) => t.name === tool.name)) return reject('InvalidStateError', 'Duplicate tool name');
      if (options.signal?.aborted) return Promise.reject(options.signal.reason);
      try {
        JSON.stringify(tool.inputSchema);
      } catch {
        return Promise.reject(new TypeError('inputSchema must be JSON.'));
      }
      registered.push(tool);
      options.signal?.addEventListener('abort', () => {
        const index = registered.indexOf(tool);
        if (index === -1) return;
        registered.splice(index, 1);
        changed();
      });
      changed();
      return Promise.resolve();
    },

    getTools: () => Promise.resolve([...registered].sort((a, b) => a.name.localeCompare(b.name)).map(describe)),

    executeTool: (tool: RegisteredTool, input?: Record<string, unknown>, options?: ModelContextExecuteToolOptions) =>
      context.call(tool.name, input, options),

    async call(name: string, input: Record<string, unknown> = {}, options: ModelContextExecuteToolOptions = {}) {
      const tool = context.tool(name);
      if (!tool) throw new DOMException('The requested tool was not found or is not accessible.', 'NotFoundError');
      const controller = new AbortController();
      const cancel = () => {
        controller.abort();
        dispatch(new ToolEvent('toolcancel', name));
      };
      if (options.signal?.aborted) throw new DOMException('Tool execution aborted.', 'AbortError');
      options.signal?.addEventListener('abort', cancel);
      const aborted = new Promise<never>((_, fail) =>
        options.signal?.addEventListener('abort', () => fail(new DOMException('Tool execution aborted.', 'AbortError')))
      );
      const running = Promise.resolve().then(() => tool.execute(structuredClone(input), { signal: controller.signal }));
      dispatch(new ToolEvent('toolactivated', name));
      try {
        return resultText(await Promise.race([running, aborted]));
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
        // Chrome 157: the agent learns that the call failed, not why.
        const error = new DOMException('Tool was executed but the invocation failed. For example, the script function threw an error', 'UnknownError');
        throw Object.assign(error, { cause });
      } finally {
        options.signal?.removeEventListener('abort', cancel);
      }
    },

    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target)
  } as unknown as FakeModelContext;

  for (const name of ['ontoolchange', 'ontoolactivated', 'ontoolcancel'] as const) {
    Object.defineProperty(context, name, { get: () => handlers[name] ?? null, set: (fn) => (handlers[name] = fn) });
  }
  return context;
}

/** Puts a fresh fake on document.modelContext and returns it. Call it in beforeEach. */
export function installModelContext(): FakeModelContext {
  const context = createModelContext();
  Object.defineProperty(document, 'modelContext', { value: context, configurable: true });
  return context;
}

/** Removes document.modelContext, as in a browser without WebMCP. */
export function removeModelContext() {
  delete (document as { modelContext?: unknown }).modelContext;
}

/** Lets pending registrations and other promise chains finish. */
export async function settle() {
  for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}
