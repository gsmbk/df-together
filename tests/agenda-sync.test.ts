import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyAgendaMutations,
  clearFlushedAgendaMutations,
  splitAgendaMutations,
  type AgendaItems,
  type PendingAgendaMutations,
} from '../src/lib/agenda-sync';

const remoteItems: AgendaItems = {
  'time-1': { sessionId: 'session-1', sessionTimeId: 'time-1' },
  'time-2': { sessionId: 'session-2', sessionTimeId: 'time-2' },
};

test('pending offline deletions override the remote snapshot', () => {
  const pending: PendingAgendaMutations = {
    'time-1': {
      revision: '1',
      sessionTimeId: 'time-1',
      type: 'delete',
    },
  };

  assert.deepEqual(applyAgendaMutations(remoteItems, pending), {
    'time-2': remoteItems['time-2'],
  });
});

test('remote deletions propagate when there is no pending local mutation', () => {
  const remoteAfterAnotherDeviceDeleted = {
    'time-2': remoteItems['time-2'],
  };

  assert.deepEqual(
    applyAgendaMutations(remoteAfterAnotherDeviceDeleted, {}),
    remoteAfterAnotherDeviceDeleted,
  );
});

test('a newer local mutation survives completion of an older sync', () => {
  const flushed: PendingAgendaMutations = {
    'time-1': {
      revision: '1',
      sessionTimeId: 'time-1',
      type: 'delete',
    },
  };
  const current: PendingAgendaMutations = {
    'time-1': {
      revision: '2',
      selection: remoteItems['time-1'],
      type: 'upsert',
    },
  };

  assert.deepEqual(clearFlushedAgendaMutations(current, flushed), current);
});

test('mutations split into bulk Supabase upserts and deletions', () => {
  const pending: PendingAgendaMutations = {
    'time-1': {
      revision: '1',
      selection: remoteItems['time-1'],
      type: 'upsert',
    },
    'time-2': {
      revision: '2',
      sessionTimeId: 'time-2',
      type: 'delete',
    },
  };

  assert.deepEqual(splitAgendaMutations(pending), {
    deletions: ['time-2'],
    upserts: [remoteItems['time-1']],
  });
});
