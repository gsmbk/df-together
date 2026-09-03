import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAgendaMutations, agendaItemsFromSelections } from '../src/lib/agenda-sync';
import { shortDay, timeRange, weekday } from '../src/data/catalog';

test('formats day and time labels the way the UI expects', () => {
  assert.equal(shortDay('Tuesday, Sep 15'), 'Tue 15');
  assert.equal(weekday('Wednesday, Sep 16'), 'Wednesday');
  assert.equal(
    timeRange({
      id: 't',
      dateLabel: 'Tuesday, Sep 15',
      startTime: '9:00 AM',
      endTime: '9:20 AM',
      timeZoneAbbreviation: 'PDT',
      location: '',
      seating: '',
      actionLabel: '',
      startAt: '',
      endAt: '',
    }),
    '9:00–9:20 AM',
  );
  assert.equal(
    timeRange({
      id: 't',
      dateLabel: 'Tuesday, Sep 15',
      startTime: '11:30 AM',
      endTime: '1:00 PM',
      timeZoneAbbreviation: 'PDT',
      location: '',
      seating: '',
      actionLabel: '',
      startAt: '',
      endAt: '',
    }),
    '11:30 AM–1:00 PM',
  );
});

test('a swap removes one occurrence and adds another in one pass', () => {
  const base = agendaItemsFromSelections([{ sessionId: 's', sessionTimeId: 'old' }]);
  const next = applyAgendaMutations(base, {
    old: { revision: '1', type: 'delete', sessionTimeId: 'old' },
    new: { revision: '2', type: 'upsert', selection: { sessionId: 's', sessionTimeId: 'new' } },
  });
  assert.deepEqual(Object.keys(next), ['new']);
});
