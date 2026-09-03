import assert from 'node:assert/strict';
import test from 'node:test';
import { sessions } from '../src/data/catalog';
import {
  APP_EVENT_MARKER,
  matchCalendarEvent,
  normalizeTitle,
  reconcile,
} from '../src/lib/salesforce-agenda';
import type { ResolvedAgendaItem } from '../src/types';

/** A real catalog session with a single occurrence, for stable expectations. */
const single = sessions.find((session) => session.times.length === 1)!;
const repeated = sessions.find((session) => session.times.length > 2)!;

function planned(sessionId: string, sessionTimeId: string): ResolvedAgendaItem {
  const session = sessions.find((candidate) => candidate.id === sessionId)!;
  const time = session.times.find((candidate) => candidate.id === sessionTimeId)!;
  return { session, time };
}

test('normalizes titles across punctuation and spacing differences', () => {
  assert.equal(normalizeTitle('Build Trusted Agents: A Guide'), 'build trusted agents a guide');
  assert.equal(normalizeTitle('Data  360 —  Deep   Dive'), 'data 360 deep dive');
  assert.equal(normalizeTitle('It’s Here'), 'it s here');
});

test('matches a calendar entry to the catalog occurrence closest in time', () => {
  const match = matchCalendarEvent({
    title: single.title,
    startDate: new Date(single.times[0].startAt),
  });
  assert.ok(match);
  assert.equal(match.session.id, single.id);
  assert.equal(match.time.id, single.times[0].id);
  assert.equal(match.driftMinutes, 0);
});

test('picks the right occurrence for a session that repeats', () => {
  const target = repeated.times[2];
  const match = matchCalendarEvent({ title: repeated.title, startDate: new Date(target.startAt) });
  assert.ok(match);
  assert.equal(match.time.id, target.id);
});

test('ignores events this app wrote into the calendar itself', () => {
  const match = matchCalendarEvent({
    title: single.title,
    notes: `Some abstract\n\n${APP_EVENT_MARKER}. This does not reserve seats.`,
    startDate: new Date(single.times[0].startAt),
  });
  assert.equal(match, null);
});

test('ignores personal events that do not correspond to a session', () => {
  assert.equal(matchCalendarEvent({ title: 'Dentist', startDate: new Date() }), null);
  assert.equal(matchCalendarEvent({ title: '', startDate: new Date() }), null);
  assert.equal(matchCalendarEvent({ title: single.title, startDate: null }), null);
});

test('separates reserved-and-planned from reserved-only and drops the rest', () => {
  const time = single.times[0];
  const report = reconcile(
    [
      { title: single.title, startDate: new Date(time.startAt) },
      { title: 'Team standup', startDate: new Date(time.startAt) },
    ],
    [planned(single.id, time.id)],
  );

  assert.equal(report.scanned, 2);
  assert.equal(report.matched.length, 1);
  assert.equal(report.matched[0].status, 'planned');
  assert.deepEqual(report.missingReservation, []);

  const unplanned = reconcile([{ title: single.title, startDate: new Date(time.startAt) }], []);
  assert.equal(unplanned.matched[0].status, 'unplanned');
});

test('flags a booking whose calendar time drifted from the catalog', () => {
  const time = single.times[0];
  const moved = new Date(Date.parse(time.startAt) + 90 * 60_000);
  const report = reconcile([{ title: single.title, startDate: moved }], [planned(single.id, time.id)]);

  assert.equal(report.matched.length, 1);
  assert.equal(report.matched[0].status, 'timeChanged');
  assert.equal(report.matched[0].driftMinutes, 90);
});

test('reports planned sessions that have no matching calendar entry', () => {
  const time = single.times[0];
  const report = reconcile([], [planned(single.id, time.id)]);
  assert.equal(report.matched.length, 0);
  assert.equal(report.missingReservation.length, 1);
  assert.equal(report.missingReservation[0].time.id, time.id);
});
