/**
 * The Tools tab: the page's tools as an agent sees them (document.modelContext.getTools()), each with a form
 * to call it (executeTool()). DevTools > Application > WebMCP shows the same list; this one needs no extra flag.
 */
import { useState } from 'react';
import { pretty, useTools, webmcpSupported } from './hooks.ts';

/** A starting point for the input: the required fields, with a placeholder by type. */
function exampleInput(schema: JSONSchema | undefined): string {
  const example: Record<string, unknown> = {};
  for (const name of schema?.required ?? []) {
    const property = schema?.properties?.[name];
    example[name] = property?.enum?.[0] ?? (property?.type === 'number' || property?.type === 'integer' ? 1 : property?.type === 'boolean' ? false : '');
  }
  return JSON.stringify(example, null, 2);
}

const isFormTool = (name: string) => !!document.querySelector(`form[toolname="${CSS.escape(name)}"]`);

function ToolCard({ tool }: { tool: RegisteredTool }) {
  const [input, setInput] = useState(() => exampleInput(tool.inputSchema));
  const [output, setOutput] = useState<{ kind: 'ok' | 'failed'; text: string } | null>(null);
  const [running, setRunning] = useState<AbortController | null>(null);
  const annotations = tool.annotations ?? {};
  const form = isFormTool(tool.name);

  async function run() {
    let parsed: Record<string, unknown>;
    try {
      parsed = input.trim() ? (JSON.parse(input) as Record<string, unknown>) : {};
    } catch {
      return setOutput({ kind: 'failed', text: 'The input is not valid JSON.' });
    }
    const controller = new AbortController();
    setRunning(controller);
    setOutput(null);
    try {
      const result = await document.modelContext.executeTool(tool, parsed, { signal: controller.signal });
      setOutput({ kind: 'ok', text: result === null ? '(the page navigated)' : pretty(result) });
    } catch (error) {
      // What an agent gets when execute throws: the fact that it failed, not the reason.
      setOutput({ kind: 'failed', text: error instanceof Error ? `${error.name}: ${error.message}` : String(error) });
    } finally {
      setRunning(null);
    }
  }

  return (
    <li className="ws-tool">
      <details>
        <summary>
          <code className="ws-tool-name">{tool.name}</code>
          {form && <span className="ws-badge" data-tone="form" title="Declared on a <form> with toolname">form</span>}
          {annotations.readOnlyHint && <span className="ws-badge" data-tone="read">read-only</span>}
          {annotations.consequentialHint && <span className="ws-badge" data-tone="danger">consequential</span>}
          {annotations.untrustedContentHint && <span className="ws-badge" data-tone="warn">untrusted content</span>}
          <span className="ws-tool-desc">{tool.description}</span>
        </summary>
        <div className="ws-tool-body">
          {tool.inputSchema ? (
            <>
              <h4>Input schema</h4>
              <pre>{JSON.stringify(tool.inputSchema, null, 2)}</pre>
            </>
          ) : (
            <p className="ws-muted">No input schema: this tool takes no input.</p>
          )}
          <h4>Call it</h4>
          <textarea aria-label={`Input for ${tool.name}, as JSON`} spellCheck={false} rows={Math.min(8, input.split('\n').length + 1)} value={input} onChange={(e) => setInput(e.target.value)} />
          <p className="ws-row">
            <button type="button" className="ws-btn" onClick={run} disabled={!!running}>
              {running ? 'Running…' : 'Run tool'}
            </button>
            {running && (
              <button type="button" className="ws-btn ws-btn-quiet" onClick={() => running.abort()}>
                Cancel
              </button>
            )}
            {running && form && <span className="ws-muted">The form is filled in. Press its submit button in the page.</span>}
          </p>
          {output && (
            <pre className="ws-output" data-kind={output.kind}>
              {output.text}
            </pre>
          )}
        </div>
      </details>
    </li>
  );
}

export function WebMCPOff() {
  return (
    <div className="ws-notice">
      <p>
        <b>WebMCP is off in this browser.</b> The shop works, but <code>document.modelContext</code> doesn’t exist, so no tools are registered.
      </p>
      <ol>
        <li>Use Chrome 155 or later.</li>
        <li>
          Open <code>chrome://flags/#enable-webmcp-testing</code> and set it to <b>Enabled</b>.
        </li>
        <li>
          If <code>chrome://flags/#devtools-webmcp-support</code> is listed, enable it too.
        </li>
        <li>Relaunch Chrome and reload this page.</li>
      </ol>
    </div>
  );
}

export function ToolsTab({ errors }: { errors: string[] }) {
  const { tools, refresh } = useTools();
  if (!webmcpSupported()) return <WebMCPOff />;
  return (
    <div className="ws-tools">
      <p className="ws-row ws-muted">
        <span>
          {tools.length} tool{tools.length === 1 ? '' : 's'} on this page, from <code>document.modelContext.getTools()</code>
        </span>
        <button type="button" className="ws-btn ws-btn-quiet" onClick={refresh}>
          Refresh
        </button>
      </p>
      {errors.map((error, i) => (
        <p key={i} className="ws-notice" role="alert">
          {error}
        </p>
      ))}
      {tools.length === 0 && <p className="ws-notice">No tools yet. Step 2.1 registers the first one.</p>}
      <ul>
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </ul>
    </div>
  );
}
