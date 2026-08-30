import rawCatalog from './sessions.json';
import type {
  Catalog,
  CatalogFilters,
  DreamforceSession,
  FilterKey,
  SessionTime,
} from '../types';

export const catalog = rawCatalog as Catalog;
export const sessions = catalog.sessions;

export const sessionsById = new Map(
  sessions.map((session) => [session.id, session] as const),
);

export const timeIndex = new Map<
  string,
  { session: DreamforceSession; time: SessionTime }
>();

for (const session of sessions) {
  for (const time of session.times) {
    timeIndex.set(time.id, { session, time });
  }
}

export const filterLabels: Record<FilterKey, string> = {
  formats: 'Session format',
  products: 'Product',
  roles: 'Role',
  industries: 'Industry',
  topics: 'Topic',
  levels: 'Session level',
  locations: 'Location',
  requiredEquipment: 'Required equipment',
  community: 'Community',
  viewingOptions: 'Viewing options',
  days: 'Day',
};

export const filterOrder: FilterKey[] = [
  'formats',
  'products',
  'roles',
  'industries',
  'topics',
  'levels',
  'locations',
  'requiredEquipment',
  'community',
  'viewingOptions',
  'days',
];

export const filterOptions = Object.fromEntries(
  filterOrder.map((key) => [
    key,
    [...new Set(sessions.flatMap((session) => session[key]))].sort((a, b) =>
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

export function earliestTime(session: DreamforceSession) {
  return [...session.times].sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
}

export function sessionMatches(
  session: DreamforceSession,
  query: string,
  filters: CatalogFilters,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (normalizedQuery) {
    const haystack = [
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
    ]
      .join(' ')
      .toLocaleLowerCase();
    if (!haystack.includes(normalizedQuery)) return false;
  }

  return filterOrder.every((key) => {
    const selected = filters[key];
    if (!selected.length) return true;
    return selected.some((value) => session[key].includes(value));
  });
}

export function overlappingTimes(first: SessionTime, second: SessionTime) {
  return first.startAt < second.endAt && first.endAt > second.startAt;
}
