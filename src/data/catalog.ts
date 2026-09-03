import rawCatalog from './sessions.json';
import type {
  Catalog,
  CatalogFilters,
  DreamforceSession,
  FilterKey,
  ResolvedAgendaItem,
  SessionTime,
} from '../types';

export const catalog = rawCatalog as Catalog;
export const sessions = catalog.sessions;

export const sessionsById = new Map(
  sessions.map((session) => [session.id, session] as const),
);

export const timeIndex = new Map<string, ResolvedAgendaItem>();

/**
 * Per-session derived data computed once at startup so search and sorting do
 * not allocate on every keystroke. Sessions outside the bundled catalog (for
 * example in tests) fall back to computing the same values lazily.
 */
type SessionMeta = {
  searchText: string;
  earliest: SessionTime;
};

const metaCache = new WeakMap<DreamforceSession, SessionMeta>();

function buildMeta(session: DreamforceSession): SessionMeta {
  const searchText = [
    session.title,
    session.abstract,
    ...session.formats,
    ...session.products,
    ...session.roles,
    ...session.industries,
    ...session.topics,
    ...session.requiredEquipment,
    ...session.community,
    ...session.viewingOptions,
    ...(session.speakers ?? []),
  ]
    .join(' ')
    .toLocaleLowerCase();
  let earliest = session.times[0];
  for (const time of session.times) {
    if (time.startAt < earliest.startAt) earliest = time;
  }
  return { searchText, earliest };
}

function metaFor(session: DreamforceSession) {
  let meta = metaCache.get(session);
  if (!meta) {
    meta = buildMeta(session);
    metaCache.set(session, meta);
  }
  return meta;
}

for (const session of sessions) {
  metaFor(session);
  for (const time of session.times) {
    timeIndex.set(time.id, { session, time });
  }
}

/** Sessions ordered by their earliest occurrence, then title. Filtering this
 * list preserves the order, so Browse never has to sort. */
export const sortedSessions = [...sessions].sort((a, b) => {
  const byStart = metaFor(a).earliest.startAt.localeCompare(metaFor(b).earliest.startAt);
  return byStart !== 0 ? byStart : a.title.localeCompare(b.title);
});

export const filterLabels: Record<FilterKey, string> = {
  formats: 'Format',
  products: 'Product',
  roles: 'Role',
  industries: 'Industry',
  topics: 'Topic',
  levels: 'Level',
  locations: 'Location',
  requiredEquipment: 'Required equipment',
  community: 'Community',
  viewingOptions: 'Viewing options',
  days: 'Day',
};

export const filterOrder: FilterKey[] = [
  'days',
  'formats',
  'products',
  'roles',
  'topics',
  'levels',
  'industries',
  'locations',
  'viewingOptions',
  'community',
  'requiredEquipment',
];

/** Distinct event days in chronological order, e.g. "Monday, Sep 14". */
export const dayOptions = (() => {
  const firstStart = new Map<string, string>();
  for (const session of sessions) {
    for (const time of session.times) {
      const existing = firstStart.get(time.dateLabel);
      if (!existing || time.startAt < existing) firstStart.set(time.dateLabel, time.startAt);
    }
  }
  return [...firstStart.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([label]) => label);
})();

export const filterOptions = Object.fromEntries(
  filterOrder.map((key) => [
    key,
    key === 'days'
      ? dayOptions
      : [...new Set(sessions.flatMap((session) => session[key]))].sort((a, b) =>
          a.localeCompare(b),
        ),
  ]),
) as Record<FilterKey, string[]>;

export const emptyFilters = (): CatalogFilters => ({
  formats: [],
  products: [],
  roles: [],
  industries: [],
  topics: [],
  levels: [],
  locations: [],
  requiredEquipment: [],
  community: [],
  viewingOptions: [],
  days: [],
});

export function countActiveFilters(filters: CatalogFilters) {
  return Object.values(filters).reduce((total, values) => total + values.length, 0);
}

export function earliestTime(session: DreamforceSession) {
  return metaFor(session).earliest;
}

export function sessionMatches(
  session: DreamforceSession,
  query: string,
  filters: CatalogFilters,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (normalizedQuery && !metaFor(session).searchText.includes(normalizedQuery)) {
    return false;
  }

  for (const key of filterOrder) {
    const selected = filters[key];
    if (!selected.length) continue;
    const values = session[key];
    let matched = false;
    for (const value of selected) {
      if (values.includes(value)) {
        matched = true;
        break;
      }
    }
    if (!matched) return false;
  }
  return true;
}

/** Sessions whose products or roles intersect the person's interests. */
export function sessionMatchesInterests(
  session: DreamforceSession,
  interests: { products: string[]; roles: string[] },
) {
  if (!interests.products.length && !interests.roles.length) return true;
  return (
    interests.products.some((value) => session.products.includes(value)) ||
    interests.roles.some((value) => session.roles.includes(value))
  );
}

export function overlappingTimes(first: SessionTime, second: SessionTime) {
  return first.startAt < second.endAt && first.endAt > second.startAt;
}

/** Resolve selections against the catalog, dropping unknown ids, sorted by start. */
export function resolveSelections(
  selections: Iterable<{ sessionTimeId: string }>,
): ResolvedAgendaItem[] {
  const resolved: ResolvedAgendaItem[] = [];
  for (const selection of selections) {
    const item = timeIndex.get(selection.sessionTimeId);
    if (item) resolved.push(item);
  }
  return resolved.sort((a, b) => a.time.startAt.localeCompare(b.time.startAt));
}

/** Short day label like "Tue 15" from "Tuesday, Sep 15". */
export function shortDay(dateLabel: string) {
  const match = dateLabel.match(/^(\w{3})\w*, \w+ (\d+)/);
  return match ? `${match[1]} ${match[2]}` : dateLabel;
}

/** Weekday only, like "Tuesday". */
export function weekday(dateLabel: string) {
  return dateLabel.split(',')[0] ?? dateLabel;
}

/** "9:00–9:20 AM" style range, dropping a duplicated meridiem. */
export function timeRange(time: SessionTime) {
  const [startClock, startMeridiem] = time.startTime.split(' ');
  const [, endMeridiem] = time.endTime.split(' ');
  if (startMeridiem && startMeridiem === endMeridiem) {
    return `${startClock}–${time.endTime}`;
  }
  return `${time.startTime}–${time.endTime}`;
}
