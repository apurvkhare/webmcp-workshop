import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ShopApp, ShopState } from '../client/shop.ts';
import { ShopError } from '../core/types.ts';

export function useShopState(shop: ShopApp): ShopState {
  return useSyncExternalStore(shop.subscribe, shop.getState);
}

/** A ShopError's message is written for the shopper. Anything else is a bug, so it gets a generic line. */
export function errorMessage(error: unknown): string {
  if (error instanceof ShopError) return error.message;
  console.error(error);
  return 'Something went wrong on our side. Please try again in a moment.';
}

export interface Loaded<T> {
  data: T | undefined;
  error: string;
  loading: boolean;
}

/**
 * Loads data for a page and loads it again when `deps` change. The previous data stays on screen while it reloads,
 * so a reload caused by `state.version` doesn't flash a skeleton.
 */
export function useLoad<T>(load: () => Promise<T>, deps: readonly unknown[]): Loaded<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    load().then(
      (value) => {
        if (!live) return;
        setData(value);
        setError('');
        setLoading(false);
      },
      (problem: unknown) => {
        if (!live) return;
        setData(undefined);
        setError(errorMessage(problem));
        setLoading(false);
      }
    );
    return () => {
      live = false;
    };
    // The caller lists what the load depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Namma Bazaar` : 'Namma Bazaar · Electronics, delivered across Bengaluru';
  }, [title]);
}
