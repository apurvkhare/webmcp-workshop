/**
 * The workshop drawer: a panel on the right of the shop with the step's guide, the page's tools,
 * the agent log, and the agent view. It is tooling for the workshop, not part of the shop:
 * add ?drawer=off to the address to hide it (for a demo with a real agent, say), ?drawer=on to bring it back.
 */
import { useEffect, useState } from 'react';
import type { ShopApp } from '../client/shop.ts';
import { ActivityTab } from './ActivityTab.tsx';
import { AgentViewTab } from './AgentViewTab.tsx';
import { GuideTab } from './GuideTab.tsx';
import { ToolsTab } from './ToolsTab.tsx';
import { useShopState, useStored, useTools, webmcpSupported } from './hooks.ts';

const TABS = [
  { id: 'guide', label: 'Guide' },
  { id: 'tools', label: 'Tools' },
  { id: 'activity', label: 'Activity' },
  { id: 'agent', label: 'Agent view' }
] as const;
type TabId = (typeof TABS)[number]['id'];

function drawerHidden(): boolean {
  const wanted = new URLSearchParams(location.search).get('drawer');
  try {
    if (wanted) sessionStorage.setItem('workshop:drawer', wanted);
    return sessionStorage.getItem('workshop:drawer') === 'off';
  } catch {
    return wanted === 'off';
  }
}

export function Workshop({ shop }: { shop: ShopApp }) {
  const [hidden] = useState(drawerHidden);
  const [open, setOpen] = useStored('open', true);
  const [tab, setTab] = useStored<TabId>('tab', 'guide');
  const [errors, setErrors] = useState<string[]>([]);
  const { tools } = useTools();
  const { log } = useShopState(shop);

  useEffect(() => {
    document.body.classList.toggle('workshop-open', open && !hidden);
    return () => document.body.classList.remove('workshop-open');
  }, [open, hidden]);

  // registerTool() returns a promise. When it rejects and nobody catches it, say so where people are looking.
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { name?: string; message?: string } | undefined;
      const text = `${reason?.name ?? 'Error'}: ${reason?.message ?? String(event.reason)}`;
      setErrors((all) => (all.includes(text) ? all : [...all, text].slice(-5)));
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, []);

  if (hidden) return null;

  const supported = webmcpSupported();
  const status = supported ? `${tools.length} tool${tools.length === 1 ? '' : 's'}` : 'WebMCP off';

  if (!open) {
    return (
      <button type="button" className="ws-toggle" data-supported={supported} onClick={() => setOpen(true)} aria-label={`Open the workshop drawer. ${status}.`}>
        Workshop <span>{status}</span>
      </button>
    );
  }

  return (
    <aside className="ws-drawer" aria-label="Workshop drawer">
      <header className="ws-head">
        <strong>Workshop</strong>
        <span className="ws-status" data-supported={supported}>
          {status}
        </span>
        <button type="button" className="ws-btn ws-btn-quiet" title="Sign out, empty the cart, forget the orders" onClick={() => void shop.reset()}>
          Reset demo data
        </button>
        <button type="button" className="ws-btn ws-btn-quiet" onClick={() => setOpen(false)} aria-label="Close the workshop drawer">
          Close
        </button>
      </header>
      <nav className="ws-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'tools' && errors.length > 0 && <i aria-label="has errors">!</i>}
            {t.id === 'activity' && log.length > 0 && <i>{log.length}</i>}
          </button>
        ))}
      </nav>
      <div className="ws-body" role="tabpanel">
        {tab === 'guide' && <GuideTab />}
        {tab === 'tools' && <ToolsTab errors={errors} />}
        {tab === 'activity' && <ActivityTab shop={shop} />}
        {tab === 'agent' && <AgentViewTab shop={shop} />}
      </div>
    </aside>
  );
}
