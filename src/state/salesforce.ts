import { createStore } from './store';
import type { ReconciledStatus } from '../lib/salesforce-agenda';

/**
 * Only the conclusions of a calendar scan are stored, never the calendar
 * entries themselves. Each record is an occurrence id that matched a catalog
 * session, so nothing personal survives the scan.
 */
export type StoredMatch = {
  sessionTimeId: string;
  sessionId: string;
  status: ReconciledStatus;
  driftMinutes: number;
};

export type SalesforceState = {
  /** Whether the person has opted into reading the calendar. */
  enabled: boolean;
  matches: StoredMatch[];
  checkedAt: string | null;
  scanned: number;
};

export const salesforceStore = createStore<SalesforceState>(
  { enabled: false, matches: [], checkedAt: null, scanned: 0 },
  { key: 'df-together.salesforce-check.v1' },
);

export const useSalesforce = salesforceStore.use;

export function setSalesforceEnabled(enabled: boolean) {
  salesforceStore.set((current) =>
    enabled
      ? { ...current, enabled: true }
      : { enabled: false, matches: [], checkedAt: null, scanned: 0 },
  );
}

export function storeReconciliation(matches: StoredMatch[], checkedAt: string, scanned: number) {
  salesforceStore.set((current) => ({ ...current, matches, checkedAt, scanned }));
}

/** Occurrence ids that appear on the official agenda, for badges elsewhere. */
export function reservedIdsFrom(state: SalesforceState) {
  return new Set(state.enabled ? state.matches.map((match) => match.sessionTimeId) : []);
}
