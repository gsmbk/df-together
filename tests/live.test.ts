import assert from 'node:assert/strict';
import test from 'node:test';
import { buildingFor, gapMinutes, walkMinutes } from '../src/data/venues';
import { commonFreeSlots } from '../src/lib/free-time';
import { liveSnapshot, tightTransitions } from '../src/lib/live';
import type { DreamforceSession, ResolvedAgendaItem, SessionTime } from '../src/types';

function item(id: string, startAt: string, endAt: string, location: string): ResolvedAgendaItem {
  const time: SessionTime = {
    id,
    startAt,
    endAt,
    dateLabel: 'Tuesday, Sep 15',
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    timeZoneAbbreviation: 'PDT',
    location,
    seating: '',
    actionLabel: '',
  };
  const session: DreamforceSession = {
    id: `session-${id}`,
    title: `Session ${id}`,
    abstract: '',
    officialUrl: 'https://example.com',
    formats: [],
    products: [],
    roles: [],
    industries: [],
    topics: [],
    levels: [],
    locations: [location],
    days: ['Tuesday, Sep 15'],
    requiredEquipment: [],
    objectives: [],
    community: [],
    viewingOptions: [],
    catalogBadges: [],
    times: [time],
  };
  return { session, time };
}

test('maps catalog locations to buildings and walking estimates', () => {
  assert.equal(buildingFor('Moscone West, L2, Theater 4'), 'Moscone West');
  assert.equal(buildingFor('Metreon AMC, L3, Theatre 13'), 'Metreon');
  assert.equal(buildingFor('InterCon, L3, Union Square, Roundtable 5'), 'InterContinental');
  assert.equal(walkMinutes('Moscone West, L2, Theater 4', 'Moscone West, L2, Theater 4'), 0);
  assert.equal(walkMinutes('Moscone West, L2, Theater 4', 'Moscone West, L3, Room 3018'), 5);
  assert.equal(walkMinutes('Moscone West, L2, Theater 4', 'Moscone North, LL, Campground, Theater 1'), 8);
  assert.equal(walkMinutes('Moscone North, LL, Campground, Theater 1', 'Moscone West, L2, Theater 4'), 8);
  assert.equal(gapMinutes('2026-09-15T09:00:00-07:00', '2026-09-15T09:20:00-07:00'), 20);
});

test('flags transitions where the walk is longer than the gap', () => {
  const items = [
    item('a', '2026-09-15T09:00:00-07:00', '2026-09-15T09:20:00-07:00', 'Moscone West, L2, Theater 4'),
    item('b', '2026-09-15T09:25:00-07:00', '2026-09-15T10:00:00-07:00', 'Moscone South, LL, Content Pavilion, Stage 6'),
    item('c', '2026-09-15T10:30:00-07:00', '2026-09-15T11:00:00-07:00', 'Moscone South, LL, Content Pavilion, Stage 1'),
  ];
  const tight = tightTransitions(items);
  assert.deepEqual([...tight.keys()], ['b']);
  assert.equal(tight.get('b')?.walk, 10);
  assert.equal(tight.get('b')?.gap, 5);
});

test('describes what is happening now and what is next', () => {
  const items = [
    item('a', '2026-09-15T09:00:00-07:00', '2026-09-15T09:20:00-07:00', 'Moscone West, L2, Theater 4'),
    item('b', '2026-09-15T09:30:00-07:00', '2026-09-15T10:00:00-07:00', 'Moscone North, LL, Campground, Theater 1'),
  ];
  const snapshot = liveSnapshot(items, new Date('2026-09-15T09:10:00-07:00'));
  assert.equal(snapshot.current.length, 1);
  assert.equal(snapshot.current[0].time.id, 'a');
  assert.equal(snapshot.next?.time.id, 'b');
  assert.equal(snapshot.minutesUntilNext, 20);
  assert.match(snapshot.walkHint ?? '', /8 min walk/);
  assert.equal(snapshot.live, true);

  const later = liveSnapshot(items, new Date('2026-09-15T11:00:00-07:00'));
  assert.equal(later.current.length, 0);
  assert.equal(later.next, null);
});

test('finds shared free time between two agendas within conference hours', () => {
  const mine = [item('a', '2026-09-15T09:00:00-07:00', '2026-09-15T10:00:00-07:00', 'Moscone West')];
  const theirs = [item('b', '2026-09-15T13:00:00-07:00', '2026-09-15T14:00:00-07:00', 'Moscone West')];
  const slots = commonFreeSlots(mine, theirs);
  assert.deepEqual(
    slots.map((slot) => [new Date(slot.startAt).toISOString(), new Date(slot.endAt).toISOString(), slot.minutes]),
    [
      ['2026-09-15T15:00:00.000Z', '2026-09-15T16:00:00.000Z', 60],
      ['2026-09-15T17:00:00.000Z', '2026-09-15T20:00:00.000Z', 180],
      ['2026-09-15T21:00:00.000Z', '2026-09-16T01:00:00.000Z', 240],
    ],
  );
});
