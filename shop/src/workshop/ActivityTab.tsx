/** The Activity tab: the agent log. shop.log.record() writes here, which is what step 6.1's withLogging calls. */
import type { ShopApp } from '../client/shop.ts';
import { pretty, useShopState } from './hooks.ts';

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour12: false });

export function ActivityTab({ shop }: { shop: ShopApp }) {
  const { log } = useShopState(shop);
  return (
    <div className="ws-activity">
      <p className="ws-row ws-muted">
        <span>
          {log.length} call{log.length === 1 ? '' : 's'} logged, newest first
        </span>
        <button type="button" className="ws-btn ws-btn-quiet" onClick={shop.clearLog} disabled={!log.length}>
          Clear
        </button>
      </p>
      {log.length === 0 && (
        <p className="ws-notice">
          Nothing logged yet. Tool calls show up here once <code>withLogging()</code> records them: that is step 6.1. Each line also goes to the terminal running <code>npm start</code>.
        </p>
      )}
      <ol>
        {log.map((call) => (
          <li key={call.id} className="ws-call" data-outcome={call.outcome}>
            <details>
              <summary>
                <time>{time(call.at)}</time>
                <code className="ws-tool-name">{call.tool}</code>
                <span className="ws-badge" data-tone={call.outcome === 'ok' ? 'read' : call.outcome === 'activated' ? 'form' : 'danger'}>
                  {call.outcome}
                </span>
                {call.ms !== undefined && <span className="ws-muted">{call.ms} ms</span>}
              </summary>
              {call.input !== undefined && (
                <>
                  <h4>Input</h4>
                  <pre>{JSON.stringify(call.input, null, 2)}</pre>
                </>
              )}
              {call.result !== undefined && (
                <>
                  <h4>Result</h4>
                  <pre>{pretty(call.result)}</pre>
                </>
              )}
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
