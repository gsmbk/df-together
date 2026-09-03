import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

type Listener = () => void;

export type Store<T> = {
  get: () => T;
  set: (next: T | ((current: T) => T)) => void;
  subscribe: (listener: Listener) => () => void;
  /** React hook returning the current value (re-renders on change). */
  use: () => T;
  /** Resolves once persisted state has been loaded (immediately for memory stores). */
  ready: Promise<void>;
};

/**
 * A minimal external store built on useSyncExternalStore. Stores hold a single
 * immutable value; components subscribe with `use()` and only re-render when
 * the value identity changes. Optionally persisted to AsyncStorage.
 */
export function createStore<T>(initial: T, options?: { key?: string }): Store<T> {
  let value = initial;
  const listeners = new Set<Listener>();
  let writeChain: Promise<unknown> = Promise.resolve();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const persist = (next: T) => {
    if (!options?.key) return;
    const key = options.key;
    writeChain = writeChain
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(key, JSON.stringify(next)))
      .catch(() => undefined);
  };

  const store: Store<T> = {
    get: () => value,
    set: (next) => {
      const resolved =
        typeof next === 'function' ? (next as (current: T) => T)(value) : next;
      if (Object.is(resolved, value)) return;
      value = resolved;
      persist(value);
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    use: () => useSyncExternalStore(store.subscribe, store.get, store.get),
    ready: Promise.resolve(),
  };

  if (options?.key) {
    const key = options.key;
    store.ready = AsyncStorage.getItem(key)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw) as Partial<T>;
          value =
            parsed && typeof parsed === 'object' && !Array.isArray(parsed)
              ? { ...initial, ...parsed }
              : (parsed as T);
          notify();
        } catch {
          // Ignore corrupt persisted state and keep defaults.
        }
      })
      .catch(() => undefined);
  }

  return store;
}
