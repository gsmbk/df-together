import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { supabase } from '../lib/supabase';
import type { AgendaSelection } from '../types';
import { useAuth } from './AuthContext';

const AGENDA_STORAGE_PREFIX = 'df-together.agenda.v1';

function storageKey(owner: string) {
  return `${AGENDA_STORAGE_PREFIX}.${owner}`;
}

type AgendaContextValue = {
  hydrated: boolean;
  selections: AgendaSelection[];
  selectedTimeIds: Set<string>;
  add: (selection: AgendaSelection) => Promise<void>;
  remove: (sessionTimeId: string) => Promise<void>;
  toggle: (selection: AgendaSelection) => Promise<void>;
  isSelected: (sessionTimeId: string) => boolean;
};

const AgendaContext = createContext<AgendaContextValue | null>(null);

export function AgendaProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const owner = user?.id ?? 'guest';
  const [hydrated, setHydrated] = useState(false);
  const [activeOwner, setActiveOwner] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, AgendaSelection>>({});

  useEffect(() => {
    if (authLoading || activeOwner === owner) return;
    let cancelled = false;
    setHydrated(false);

    const loadOwnerAgenda = async () => {
      const stored = await AsyncStorage.getItem(storageKey(owner));
      const saved = stored ? (JSON.parse(stored) as AgendaSelection[]) : [];
      const savedItems = Object.fromEntries(
        saved.map((item) => [item.sessionTimeId, item]),
      );
      const migratingGuestAgenda = activeOwner === 'guest' && owner !== 'guest';
      const nextItems = migratingGuestAgenda ? { ...savedItems, ...items } : savedItems;

      if (migratingGuestAgenda) {
        await AsyncStorage.removeItem(storageKey('guest'));
      }
      if (cancelled) return;
      setItems(nextItems);
      setActiveOwner(owner);
      setHydrated(true);
    };

    loadOwnerAgenda().catch(() => {
      if (cancelled) return;
      setItems({});
      setActiveOwner(owner);
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [activeOwner, authLoading, owner]);

  useEffect(() => {
    if (!hydrated || activeOwner !== owner) return;
    AsyncStorage.setItem(storageKey(activeOwner), JSON.stringify(Object.values(items)));
  }, [activeOwner, hydrated, items, owner]);

  useEffect(() => {
    if (!supabase || !user || !hydrated || activeOwner !== user.id) return;
    const client = supabase;

    const sync = async () => {
      const { data, error } = await client
        .from('agenda_items')
        .select('session_id,session_time_id')
        .eq('user_id', user.id);
      if (error) throw error;

      const remote = (data ?? []).map((row) => ({
        sessionId: row.session_id as string,
        sessionTimeId: row.session_time_id as string,
      }));
      const merged = {
        ...Object.fromEntries(remote.map((item) => [item.sessionTimeId, item])),
        ...items,
      };
      setItems(merged);

      const rows = Object.values(merged).map((item) => ({
        user_id: user.id,
        session_id: item.sessionId,
        session_time_id: item.sessionTimeId,
      }));
      if (rows.length) {
        const { error: upsertError } = await client.from('agenda_items').upsert(rows);
        if (upsertError) throw upsertError;
      }
    };

    sync().catch(() => undefined);
  }, [activeOwner, hydrated, user?.id]);

  const add = useCallback(
    async (selection: AgendaSelection) => {
      setItems((current) => ({
        ...current,
        [selection.sessionTimeId]: selection,
      }));
      if (supabase && user) {
        const { error } = await supabase.from('agenda_items').upsert({
          user_id: user.id,
          session_id: selection.sessionId,
          session_time_id: selection.sessionTimeId,
        });
        if (error) throw error;
      }
    },
    [user],
  );

  const remove = useCallback(
    async (sessionTimeId: string) => {
      setItems((current) => {
        const next = { ...current };
        delete next[sessionTimeId];
        return next;
      });
      if (supabase && user) {
        const { error } = await supabase
          .from('agenda_items')
          .delete()
          .eq('user_id', user.id)
          .eq('session_time_id', sessionTimeId);
        if (error) throw error;
      }
    },
    [user],
  );

  const selectedTimeIds = useMemo(() => new Set(Object.keys(items)), [items]);
  const toggle = useCallback(
    async (selection: AgendaSelection) => {
      if (selectedTimeIds.has(selection.sessionTimeId)) {
        await remove(selection.sessionTimeId);
      } else {
        await add(selection);
      }
    },
    [add, remove, selectedTimeIds],
  );

  const value = useMemo<AgendaContextValue>(
    () => ({
      hydrated,
      selections: Object.values(items),
      selectedTimeIds,
      add,
      remove,
      toggle,
      isSelected: (sessionTimeId) => selectedTimeIds.has(sessionTimeId),
    }),
    [add, hydrated, items, remove, selectedTimeIds, toggle],
  );

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
}

export function useAgenda() {
  const context = useContext(AgendaContext);
  if (!context) throw new Error('useAgenda must be used inside AgendaProvider');
  return context;
}
