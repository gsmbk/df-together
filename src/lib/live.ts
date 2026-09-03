import { catalog } from '../data/catalog';
import { gapMinutes, walkMinutes } from '../data/venues';
import type { ResolvedAgendaItem } from '../types';

export const eventTimeZone = catalog.metadata.timeZone || 'America/Los_Angeles';

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: eventTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const clockFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: eventTimeZone,
  hour: 'numeric',
  minute: '2-digit',
});

/** "YYYY-MM-DD" in the event's time zone. */
export function eventDateKey(date: Date) {
  return dateKeyFormatter.format(date);
}

export function formatClock(iso: string | Date) {
  return clockFormatter.format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** Event window derived from the catalog: first start to last end. */
export const eventWindow = (() => {
  let start = '';
  let end = '';
  for (const session of catalog.sessions) {
    for (const time of session.times) {
      if (!start || time.startAt < start) start = time.startAt;
      if (!end || time.endAt > end) end = time.endAt;
    }
  }
  return { start: Date.parse(start), end: Date.parse(end) };
})();

export function isDuringEvent(now: Date) {
  return now.getTime() >= eventWindow.start - 6 * 3_600_000 && now.getTime() <= eventWindow.end;
}

export type LiveSnapshot = {
  /** Sessions happening right now. */
  current: ResolvedAgendaItem[];
  /** The next session that has not started yet. */
  next: ResolvedAgendaItem | null;
  /** Minutes until `next` starts (0 when it is imminent). */
  minutesUntilNext: number;
  /** Walking hint when the next session is in a different place than the current one. */
  walkHint: string | null;
  /** Whether the person is inside the event window at all. */
  live: boolean;
};

export function liveSnapshot(items: ResolvedAgendaItem[], now: Date): LiveSnapshot {
  const timestamp = now.getTime();
  const current = items.filter(
    (item) => Date.parse(item.time.startAt) <= timestamp && Date.parse(item.time.endAt) > timestamp,
  );
  const next = items.find((item) => Date.parse(item.time.startAt) > timestamp) ?? null;
  const minutesUntilNext = next
    ? Math.max(0, Math.round((Date.parse(next.time.startAt) - timestamp) / 60_000))
    : 0;

  let walkHint: string | null = null;
  const origin = current[current.length - 1] ?? null;
  if (next && origin && origin.time.location !== next.time.location) {
    const walk = walkMinutes(origin.time.location, next.time.location);
    const gap = gapMinutes(origin.time.endAt, next.time.startAt);
    if (walk > 0) {
      walkHint =
        gap < walk
          ? `About ${walk} min walk. Leave early, there is only ${Math.max(gap, 0)} min between them.`
          : `About ${walk} min walk to the next room.`;
    }
  }

  return { current, next, minutesUntilNext, walkHint, live: isDuringEvent(now) };
}

/** Tight transitions in a day's agenda: walking time exceeds the gap. */
export function tightTransitions(items: ResolvedAgendaItem[]) {
  const flags = new Map<string, { walk: number; gap: number; from: ResolvedAgendaItem }>();
  for (let index = 1; index < items.length; index += 1) {
    const previous = items[index - 1];
    const item = items[index];
    if (previous.time.dateLabel !== item.time.dateLabel) continue;
    const gap = gapMinutes(previous.time.endAt, item.time.startAt);
    if (gap < 0) continue; // overlapping, handled as a conflict elsewhere
    const walk = walkMinutes(previous.time.location, item.time.location);
    if (walk > 0 && gap < walk) flags.set(item.time.id, { walk, gap, from: previous });
  }
  return flags;
}
