import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyFilters, overlappingTimes, sessionMatches } from '../src/data/catalog';
import type { DreamforceSession, SessionTime } from '../src/types';

function time(id: string, startAt: string, endAt: string): SessionTime {
  return {
    id,
    startAt,
    endAt,
    dateLabel: 'Tuesday, Sep 15',
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    timeZoneAbbreviation: 'PDT',
    location: 'Moscone West',
    seating: '',
    actionLabel: '',
  };
}

const sampleSession: DreamforceSession = {
  id: 'session-1',
  title: 'Build trusted agents with Agentforce',
  abstract: 'Learn practical patterns for secure enterprise agents.',
  officialUrl: 'https://example.com/session-1',
  formats: ['Breakout'],
  products: ['Agentforce'],
  roles: ['Architect'],
  industries: ['Technology'],
  topics: ['Artificial Intelligence'],
  levels: ['Intermediate'],
  locations: ['Moscone West'],
  days: ['Tuesday, Sep 15'],
  requiredEquipment: [],
  objectives: [],
  community: [],
  viewingOptions: ['In person'],
  catalogBadges: [],
  times: [
    time(
      'time-1',
      '2026-09-15T09:00:00-07:00',
      '2026-09-15T10:00:00-07:00',
    ),
  ],
};

test('detects overlaps but allows back-to-back sessions', () => {
  const first = sampleSession.times[0];
  const overlapping = time(
    'time-2',
    '2026-09-15T09:30:00-07:00',
    '2026-09-15T10:30:00-07:00',
  );
  const backToBack = time(
    'time-3',
    '2026-09-15T10:00:00-07:00',
    '2026-09-15T11:00:00-07:00',
  );

  assert.equal(overlappingTimes(first, overlapping), true);
  assert.equal(overlappingTimes(first, backToBack), false);
});

test('searches metadata and applies selected filters', () => {
  const filters = emptyFilters();
  filters.products = ['Agentforce'];
  filters.days = ['Tuesday, Sep 15'];

  assert.equal(sessionMatches(sampleSession, 'trusted agents', filters), true);
  assert.equal(sessionMatches(sampleSession, 'data cloud', filters), false);
  filters.roles = ['Developer'];
  assert.equal(sessionMatches(sampleSession, '', filters), false);
});
