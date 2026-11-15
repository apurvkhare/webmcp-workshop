/** Small hooks the drawer's tabs share. */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { ShopApp, ShopState } from '../client/shop.ts';

export const useShopState = (shop: ShopApp): ShopState => useSyncExternalStore(shop.subscribe, shop.getState);

export const webmcpSupported = () => 'modelContext' in document;

/** The page's tools, as an agent sees them. Refreshed on every toolchange event. */
export function useTools() {
  const [tools, setTools] = useState<RegisteredTool[]>([]);
  const refresh = useCallback(() => {
    if (!webmcpSupported()) return;
    document.modelContext.getTools().then(setTools, () => setTools([]));
  }, []);
  useEffect(() => {
    if (!webmcpSupported()) return;
    refresh();
    document.modelContext.addEventListener('toolchange', refresh);
    // Forms can become tools without an event reaching us on older builds, so look again now and then.
    const timer = setInterval(refresh, 3000);
    return () => {
      document.modelContext.removeEventListener('toolchange', refresh);
      clearInterval(timer);
    };
  }, [refresh]);
  return { tools, refresh };
}

/** A value kept in localStorage, so the drawer comes back the way you left it after a reload. */
export function useStored<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`workshop:${key}`);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });
  const store = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(`workshop:${key}`, JSON.stringify(next));
      } catch {
        // Private windows can refuse storage. The drawer still works, it just forgets.
      }
    },
    [key]
  );
  return [value, store];
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

export const pretty = (text: string) => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};
