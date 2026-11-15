/**
 * A tiny router on the History API. `navigate` works from anywhere (React, the shop object, a WebMCP tool),
 * and `useLocation` re-renders a component whenever the URL changes, including Back and Forward.
 */
import { useMemo, useSyncExternalStore } from 'react';

export interface NavigateOptions {
  /** Replace the current history entry instead of adding one (redirects, dragging a slider). */
  replace?: boolean;
  /** Scroll to the top of the page. On by default. */
  scroll?: boolean;
}

const listeners = new Set<() => void>();
const notify = () => {
  for (const listener of listeners) listener();
};

if (typeof window !== 'undefined') window.addEventListener('popstate', notify);

export function navigate(path: string, options: NavigateOptions = {}): void {
  const current = location.pathname + location.search + location.hash;
  if (path !== current) {
    if (options.replace) history.replaceState(null, '', path);
    else history.pushState(null, '', path);
    notify();
  }
  if (options.scroll !== false) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => location.pathname + location.search;

export interface RouteLocation {
  pathname: string;
  params: URLSearchParams;
  /** pathname + search, for example "/search?query=mouse". */
  href: string;
}

export function useLocation(): RouteLocation {
  const href = useSyncExternalStore(subscribe, snapshot);
  return useMemo(() => {
    const url = new URL(href, location.origin);
    return { pathname: url.pathname, params: url.searchParams, href };
  }, [href]);
}

/** True for a click the browser would turn into a same-tab navigation. */
export function isPlainClick(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; defaultPrevented: boolean }) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** A `next` parameter is only followed when it is a path on this site. */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}
