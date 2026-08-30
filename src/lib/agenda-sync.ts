import type { AgendaSelection } from '../types';

export type AgendaItems = Record<string, AgendaSelection>;

export type PendingAgendaMutation =
  | {
      revision: string;
      type: 'upsert';
      selection: AgendaSelection;
    }
  | {
      revision: string;
      type: 'delete';
      sessionTimeId: string;
    };

export type PendingAgendaMutations = Record<string, PendingAgendaMutation>;

export function agendaItemsFromSelections(selections: AgendaSelection[]): AgendaItems {
  return Object.fromEntries(
    selections.map((selection) => [selection.sessionTimeId, selection]),
  );
}

export function applyAgendaMutations(
  baseItems: AgendaItems,
  mutations: PendingAgendaMutations,
): AgendaItems {
  const nextItems = { ...baseItems };

  for (const [sessionTimeId, mutation] of Object.entries(mutations)) {
    if (mutation.type === 'upsert') {
      nextItems[sessionTimeId] = mutation.selection;
    } else {
      delete nextItems[sessionTimeId];
    }
  }

  return nextItems;
}

export function clearFlushedAgendaMutations(
  current: PendingAgendaMutations,
  flushed: PendingAgendaMutations,
): PendingAgendaMutations {
  const remaining = { ...current };

  for (const [sessionTimeId, mutation] of Object.entries(flushed)) {
    if (remaining[sessionTimeId]?.revision === mutation.revision) {
      delete remaining[sessionTimeId];
    }
  }

  return remaining;
}

export function splitAgendaMutations(mutations: PendingAgendaMutations) {
  const upserts: AgendaSelection[] = [];
  const deletions: string[] = [];

  for (const mutation of Object.values(mutations)) {
    if (mutation.type === 'upsert') {
      upserts.push(mutation.selection);
    } else {
      deletions.push(mutation.sessionTimeId);
    }
  }

  return { deletions, upserts };
}
