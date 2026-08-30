import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';
import {
  agendaItemsFromSelections,
  applyAgendaMutations,
  clearFlushedAgendaMutations,
  splitAgendaMutations,
  type AgendaItems,
  type PendingAgendaMutations,
} from '../lib/agenda-sync';
import { supabase } from '../lib/supabase';
import type { AgendaSelection } from '../types';
import { useAuth } from './AuthContext';

const AGENDA_STORAGE_PREFIX = 'df-together.agenda.v1';
const PENDING_STORAGE_PREFIX = 'df-together.agenda-pending.v2';
const SYNC_MIGRATION_PREFIX = 'df-together.agenda-sync-v2';

function storageKey(owner: string) {
  return `${AGENDA_STORAGE_PREFIX}.${owner}`;
}

function pendingStorageKey(owner: string) {
  return `${PENDING_STORAGE_PREFIX}.${owner}`;
}

function migrationStorageKey(owner: string) {
  return `${SYNC_MIGRATION_PREFIX}.${owner}`;
}

function parseStoredValue<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

type AgendaContextValue = {
  hydrated: boolean;
  selections: AgendaSelection[];
  selectedTimeIds: Set<string>;
  pendingChangeCount: number;
  syncing: boolean;
  syncError: string | null;
  add: (selection: AgendaSelection) => Promise<void>;
  remove: (sessionTimeId: string) => Promise<void>;
  toggle: (selection: AgendaSelection) => Promise<void>;
  isSelected: (sessionTimeId: string) => boolean;
  retrySync: () => Promise<void>;
};

const AgendaContext = createContext<AgendaContextValue | null>(null);

export function AgendaProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const owner = user?.id ?? 'guest';
  const [hydrated, setHydrated] = useState(false);
  const [activeOwner, setActiveOwner] = useState<string | null>(null);
  const [items, setItems] = useState<AgendaItems>({});
  const [pendingChangeCount, setPendingChangeCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const itemsRef = useRef<AgendaItems>({});
  const pendingRef = useRef<PendingAgendaMutations>({});
  const activeOwnerRef = useRef<string | null>(null);
  const ownerGenerationRef = useRef(0);
  const mutationCounterRef = useRef(0);
  const syncPromiseRef = useRef<Promise<boolean> | null>(null);
  const syncOwnerRef = useRef<string | null>(null);
  const storageWriteRef = useRef<Promise<void>>(Promise.resolve());

  const makeRevision = useCallback(() => {
    mutationCounterRef.current += 1;
    return `${Date.now()}-${mutationCounterRef.current}`;
  }, []);

  const persistOwnerState = useCallback(
    (
      stateOwner: string,
      nextItems: AgendaItems,
      nextPending: PendingAgendaMutations,
    ) => {
      const write = storageWriteRef.current
        .catch(() => undefined)
        .then(() =>
          AsyncStorage.multiSet([
            [storageKey(stateOwner), JSON.stringify(Object.values(nextItems))],
            [pendingStorageKey(stateOwner), JSON.stringify(nextPending)],
          ]),
        );
      storageWriteRef.current = write;
      return write;
    },
    [],
  );

  useEffect(() => {
    if (authLoading || activeOwner === owner) return;
    const generation = ownerGenerationRef.current + 1;
    ownerGenerationRef.current = generation;
    let cancelled = false;
    setHydrated(false);
    setSyncing(false);
    setSyncError(null);

    const loadOwnerAgenda = async () => {
      await storageWriteRef.current.catch(() => undefined);
      const keys = [storageKey(owner), pendingStorageKey(owner)];
      if (owner !== 'guest') keys.push(storageKey('guest'));
      const storedValues = new Map(await AsyncStorage.multiGet(keys));
      const savedSelections = parseStoredValue<AgendaSelection[]>(
        storedValues.get(storageKey(owner)) ?? null,
        [],
      );
      let nextItems = agendaItemsFromSelections(savedSelections);
      let nextPending = parseStoredValue<PendingAgendaMutations>(
        storedValues.get(pendingStorageKey(owner)) ?? null,
        {},
      );

      if (owner !== 'guest') {
        const guestSelections = parseStoredValue<AgendaSelection[]>(
          storedValues.get(storageKey('guest')) ?? null,
          [],
        );
        if (guestSelections.length) {
          nextItems = {
            ...nextItems,
            ...agendaItemsFromSelections(guestSelections),
          };
          for (const selection of guestSelections) {
            nextPending[selection.sessionTimeId] = {
              revision: makeRevision(),
              selection,
              type: 'upsert',
            };
          }
          await persistOwnerState(owner, nextItems, nextPending);
          await AsyncStorage.removeItem(storageKey('guest'));
        }
      }

      if (cancelled || ownerGenerationRef.current !== generation) return;
      itemsRef.current = nextItems;
      pendingRef.current = nextPending;
      activeOwnerRef.current = owner;
      setItems(nextItems);
      setPendingChangeCount(Object.keys(nextPending).length);
      setActiveOwner(owner);
      setHydrated(true);
    };

    loadOwnerAgenda().catch((error) => {
      if (cancelled || ownerGenerationRef.current !== generation) return;
      itemsRef.current = {};
      pendingRef.current = {};
      activeOwnerRef.current = owner;
      setItems({});
      setPendingChangeCount(0);
      setActiveOwner(owner);
      setHydrated(true);
      setSyncError(
        `Could not load the agenda saved on this device: ${(error as Error).message}`,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [activeOwner, authLoading, makeRevision, owner, persistOwnerState]);

  const runSync = useCallback(async (): Promise<boolean> => {
    if (!supabase || !user || !hydrated || activeOwner !== user.id) return true;
    if (syncPromiseRef.current) {
      const existingOwner = syncOwnerRef.current;
      const existingResult = await syncPromiseRef.current;
      if (existingOwner === user.id) return existingResult;
      if (syncPromiseRef.current) return syncPromiseRef.current;
    }

    const client = supabase;
    const syncOwner = user.id;
    const generation = ownerGenerationRef.current;
    const task = (async () => {
      setSyncing(true);
      setSyncError(null);
      try {
        const [{ data, error }, migrationComplete] = await Promise.all([
          client
            .from('agenda_items')
            .select('session_id,session_time_id')
            .eq('user_id', syncOwner),
          AsyncStorage.getItem(migrationStorageKey(syncOwner)),
        ]);
        if (error) throw error;
        if (
          ownerGenerationRef.current !== generation ||
          activeOwnerRef.current !== syncOwner
        ) {
          return true;
        }

        const remoteItems = agendaItemsFromSelections(
          (data ?? []).map((row) => ({
            sessionId: row.session_id as string,
            sessionTimeId: row.session_time_id as string,
          })),
        );

        if (migrationComplete !== '1') {
          const migratedPending = { ...pendingRef.current };
          for (const selection of Object.values(itemsRef.current)) {
            if (
              !remoteItems[selection.sessionTimeId] &&
              !migratedPending[selection.sessionTimeId]
            ) {
              migratedPending[selection.sessionTimeId] = {
                revision: makeRevision(),
                selection,
                type: 'upsert',
              };
            }
          }
          pendingRef.current = migratedPending;
          setPendingChangeCount(Object.keys(migratedPending).length);
          await persistOwnerState(syncOwner, itemsRef.current, migratedPending);
        }

        const pendingSnapshot = { ...pendingRef.current };
        const { deletions, upserts } = splitAgendaMutations(pendingSnapshot);
        const writes = [];
        if (upserts.length) {
          writes.push(
            client.from('agenda_items').upsert(
              upserts.map((selection) => ({
                user_id: syncOwner,
                session_id: selection.sessionId,
                session_time_id: selection.sessionTimeId,
              })),
            ),
          );
        }
        if (deletions.length) {
          writes.push(
            client
              .from('agenda_items')
              .delete()
              .eq('user_id', syncOwner)
              .in('session_time_id', deletions),
          );
        }
        const writeResults = await Promise.all(writes);
        const writeError = writeResults.find((result) => result.error)?.error;
        if (writeError) throw writeError;

        if (
          ownerGenerationRef.current !== generation ||
          activeOwnerRef.current !== syncOwner
        ) {
          return true;
        }

        const remainingPending = clearFlushedAgendaMutations(
          pendingRef.current,
          pendingSnapshot,
        );
        const syncedItems = applyAgendaMutations(remoteItems, pendingSnapshot);
        const nextItems = applyAgendaMutations(syncedItems, remainingPending);
        itemsRef.current = nextItems;
        pendingRef.current = remainingPending;
        setItems(nextItems);
        setPendingChangeCount(Object.keys(remainingPending).length);
        await persistOwnerState(syncOwner, nextItems, remainingPending);
        await AsyncStorage.setItem(migrationStorageKey(syncOwner), '1');
        setSyncError(null);
        return true;
      } catch (error) {
        if (
          ownerGenerationRef.current === generation &&
          activeOwnerRef.current === syncOwner
        ) {
          setSyncError(
            `Your agenda is saved on this device, but it could not sync yet: ${(error as Error).message}`,
          );
        }
        return false;
      } finally {
        if (
          ownerGenerationRef.current === generation &&
          activeOwnerRef.current === syncOwner
        ) {
          setSyncing(false);
        }
      }
    })();

    syncPromiseRef.current = task;
    syncOwnerRef.current = syncOwner;
    const succeeded = await task;
    if (syncPromiseRef.current === task) {
      syncPromiseRef.current = null;
      syncOwnerRef.current = null;
    }
    return succeeded;
  }, [activeOwner, hydrated, makeRevision, persistOwnerState, user?.id]);

  const retrySync = useCallback(async () => {
    const retryOwner = user?.id;
    if (!retryOwner) return;
    let succeeded = await runSync();
    while (
      succeeded &&
      activeOwnerRef.current === retryOwner &&
      Object.keys(pendingRef.current).length > 0
    ) {
      succeeded = await runSync();
    }
  }, [runSync, user?.id]);

  useEffect(() => {
    if (!user || !hydrated || activeOwner !== user.id) return;
    void retrySync();
  }, [activeOwner, hydrated, retrySync, user?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void retrySync();
    });
    return () => subscription.remove();
  }, [retrySync]);

  const commitLocalChange = useCallback(
    async (nextItems: AgendaItems, nextPending: PendingAgendaMutations) => {
      if (!hydrated || activeOwner !== owner) {
        throw new Error('Your agenda is still loading. Please try again.');
      }
      const previousItems = itemsRef.current;
      const previousPending = pendingRef.current;
      itemsRef.current = nextItems;
      pendingRef.current = nextPending;
      setItems(nextItems);
      setPendingChangeCount(Object.keys(nextPending).length);
      try {
        await persistOwnerState(owner, nextItems, nextPending);
      } catch (error) {
        if (
          activeOwnerRef.current === owner &&
          itemsRef.current === nextItems &&
          pendingRef.current === nextPending
        ) {
          itemsRef.current = previousItems;
          pendingRef.current = previousPending;
          setItems(previousItems);
          setPendingChangeCount(Object.keys(previousPending).length);
        }
        throw error;
      }
      if (user) void retrySync();
    },
    [activeOwner, hydrated, owner, persistOwnerState, retrySync, user],
  );

  const add = useCallback(
    async (selection: AgendaSelection) => {
      const nextItems = {
        ...itemsRef.current,
        [selection.sessionTimeId]: selection,
      };
      const nextPending = user
        ? {
            ...pendingRef.current,
            [selection.sessionTimeId]: {
              revision: makeRevision(),
              selection,
              type: 'upsert' as const,
            },
          }
        : pendingRef.current;
      await commitLocalChange(nextItems, nextPending);
    },
    [commitLocalChange, makeRevision, user],
  );

  const remove = useCallback(
    async (sessionTimeId: string) => {
      const nextItems = { ...itemsRef.current };
      delete nextItems[sessionTimeId];
      const nextPending = user
        ? {
            ...pendingRef.current,
            [sessionTimeId]: {
              revision: makeRevision(),
              sessionTimeId,
              type: 'delete' as const,
            },
          }
        : pendingRef.current;
      await commitLocalChange(nextItems, nextPending);
    },
    [commitLocalChange, makeRevision, user],
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
      pendingChangeCount,
      syncing,
      syncError,
      add,
      remove,
      toggle,
      isSelected: (sessionTimeId) => selectedTimeIds.has(sessionTimeId),
      retrySync,
    }),
    [
      add,
      hydrated,
      items,
      pendingChangeCount,
      remove,
      retrySync,
      selectedTimeIds,
      syncError,
      syncing,
      toggle,
    ],
  );

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
}

export function useAgenda() {
  const context = useContext(AgendaContext);
  if (!context) throw new Error('useAgenda must be used inside AgendaProvider');
  return context;
}
