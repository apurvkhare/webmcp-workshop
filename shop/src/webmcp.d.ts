/**
 * Types for WebMCP, written from the spec's IDL (Draft Community Group Report, 13 November 2026)
 * and from what Chrome implements. TypeScript's own DOM types don't have them yet.
 * 📖 https://webmachinelearning.github.io/webmcp/
 */

/** The parts of JSON Schema a tool's input usually needs. Any other keyword is allowed too. */
interface JSONSchema {
  type?: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'null';
  description?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  enum?: readonly unknown[];
  items?: JSONSchema;
  minimum?: number;
  maximum?: number;
  default?: unknown;
  [keyword: string]: unknown;
}

/** Hints for the agent and the browser. They describe a tool; they don't enforce anything. */
interface ToolAnnotations {
  /** The tool only reads. Calling it changes nothing. */
  readOnlyHint?: boolean;
  /** The result can contain text the site didn't write, such as reviews. */
  untrustedContentHint?: boolean;
  /** The tool does something that matters and is hard to undo, such as placing an order. */
  consequentialHint?: boolean;
  /** A tool for developers. Chrome keeps it away from AI agents. */
  debugging?: boolean;
}

interface ToolExecuteCallbackOptions {
  /** Aborts when the agent or the user cancels this call. */
  signal: AbortSignal;
}

/**
 * Runs when an agent calls the tool. `input` is whatever the agent sent: Chrome does not check it
 * against `inputSchema`. Return a string; Chrome turns anything else into JSON text.
 */
type ToolExecuteCallback = (input: Record<string, any>, options: ToolExecuteCallbackOptions) => unknown;

interface ModelContextTool {
  /** 1 to 128 characters: letters, digits, `_`, `-` and `.`. */
  name: string;
  /** A short name for people, shown in browser UI. */
  title?: string;
  /** What the tool does and when to use it. This is the agent's only guide. */
  description: string;
  inputSchema?: JSONSchema;
  outputSchema?: JSONSchema;
  execute: ToolExecuteCallback;
  annotations?: ToolAnnotations;
}

interface ModelContextRegisterToolOptions {
  /** Abort it to unregister the tool. There is no unregisterTool(). */
  signal?: AbortSignal;
  /** Other origins that may see this tool, for cross-origin iframes. */
  exposedTo?: string[];
}

interface ModelContextGetToolOptions {
  fromOrigins?: string[];
}

interface ModelContextExecuteToolOptions {
  signal?: AbortSignal;
}

/** What getTools() returns: a tool's description, without its execute function. */
interface RegisteredTool {
  readonly name: string;
  /** "" when the tool has no title. */
  readonly title?: string;
  readonly description: string;
  readonly inputSchema?: JSONSchema;
  readonly outputSchema?: JSONSchema;
  readonly annotations?: ToolAnnotations;
  readonly origin: string;
  readonly window: Window;
}

interface ToolActivatedEvent extends Event {
  readonly toolName: string;
}

interface ToolCancelEvent extends Event {
  readonly toolName: string;
}

interface ModelContextEventMap {
  toolchange: Event;
  toolactivated: ToolActivatedEvent;
  toolcancel: ToolCancelEvent;
}

interface ModelContext extends EventTarget {
  /** Rejects if the name is taken or invalid, or the description is empty. */
  registerTool(tool: ModelContextTool, options?: ModelContextRegisterToolOptions): Promise<void>;
  getTools(options?: ModelContextGetToolOptions): Promise<RegisteredTool[]>;
  /** What an agent does. Resolves with the tool's result as text (null if the call made the page navigate). */
  executeTool(tool: RegisteredTool, input?: Record<string, unknown>, options?: ModelContextExecuteToolOptions): Promise<string | null>;
  ontoolchange: ((event: Event) => void) | null;
  ontoolactivated: ((event: ToolActivatedEvent) => void) | null;
  ontoolcancel: ((event: ToolCancelEvent) => void) | null;
  addEventListener<K extends keyof ModelContextEventMap>(type: K, listener: (event: ModelContextEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof ModelContextEventMap>(type: K, listener: (event: ModelContextEventMap[K]) => void, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface Document {
  /** Only there in a secure context, with the WebMCP flag or an origin trial token. */
  readonly modelContext: ModelContext;
}

/** The declarative API (Chrome only, not in the spec since October 2026): a form submitted by an agent. */
interface SubmitEvent {
  /** True when an agent filled and submitted the form through its tool. */
  readonly agentInvoked: boolean;
  /** Gives the agent its result. Call preventDefault() first. */
  respondWith(response: Promise<unknown>): void;
}
