/**
 * Venue knowledge for Dreamforce in San Francisco. Locations in the catalog
 * are strings like "Moscone West, L2, Theater 4"; the first segment names the
 * building. Walking estimates are conservative door-to-door minutes for a
 * crowded campus, including elevators and escalators.
 */

export type Building =
  | 'Moscone West'
  | 'Moscone North'
  | 'Moscone South'
  | 'Metreon'
  | 'InterContinental'
  | 'Marriott Marquis'
  | 'Yerba Buena'
  | 'Other';

const buildingPatterns: Array<[RegExp, Building]> = [
  [/moscone west/i, 'Moscone West'],
  [/moscone north/i, 'Moscone North'],
  [/moscone south/i, 'Moscone South'],
  [/metreon/i, 'Metreon'],
  [/intercon/i, 'InterContinental'],
  [/marriott/i, 'Marriott Marquis'],
  [/yerba buena|ybca|ybg/i, 'Yerba Buena'],
];

export function buildingFor(location: string): Building {
  for (const [pattern, building] of buildingPatterns) {
    if (pattern.test(location)) return building;
  }
  return 'Other';
}

/** Short label for the building, used in walking hints. */
export function buildingLabel(location: string) {
  const building = buildingFor(location);
  return building === 'Other' ? location.split(',')[0]?.trim() || 'the venue' : building;
}

const sameBuildingMinutes = 5;
const defaultCrossCampusMinutes = 12;

const walkTable: Partial<Record<Building, Partial<Record<Building, number>>>> = {
  'Moscone West': {
    'Moscone North': 8,
    'Moscone South': 10,
    Metreon: 6,
    InterContinental: 6,
    'Marriott Marquis': 8,
    'Yerba Buena': 6,
  },
  'Moscone North': {
    'Moscone South': 6,
    Metreon: 6,
    InterContinental: 12,
    'Marriott Marquis': 8,
    'Yerba Buena': 5,
  },
  'Moscone South': {
    Metreon: 8,
    InterContinental: 12,
    'Marriott Marquis': 6,
    'Yerba Buena': 6,
  },
  Metreon: {
    InterContinental: 10,
    'Marriott Marquis': 8,
    'Yerba Buena': 3,
  },
  InterContinental: {
    'Marriott Marquis': 10,
    'Yerba Buena': 8,
  },
  'Marriott Marquis': {
    'Yerba Buena': 6,
  },
};

/** Estimated walking minutes between two catalog locations. */
export function walkMinutes(fromLocation: string, toLocation: string) {
  const from = buildingFor(fromLocation);
  const to = buildingFor(toLocation);
  if (from === to) {
    return fromLocation === toLocation ? 0 : sameBuildingMinutes;
  }
  return walkTable[from]?.[to] ?? walkTable[to]?.[from] ?? defaultCrossCampusMinutes;
}

/** Minutes between the end of one occurrence and the start of the next. */
export function gapMinutes(endAt: string, startAt: string) {
  return Math.round((Date.parse(startAt) - Date.parse(endAt)) / 60_000);
}
