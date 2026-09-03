import { eventTimeZone } from './live';
import type { ResolvedAgendaItem } from '../types';

export type FreeSlot = {
  dateLabel: string;
  startAt: number;
  endAt: number;
  minutes: number;
};

type Interval = { start: number; end: number };

function mergeIntervals(intervals: Interval[]) {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: eventTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Timestamp for a wall-clock hour on the same event-zone day as `reference`. */
function atHour(reference: number, hour: number) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(new Date(reference)).map((part) => [part.type, part.value]),
  );
  const currentHour = Number(parts.hour) % 24;
  const currentMinute = Number(parts.minute);
  const midnight = reference - (currentHour * 60 + currentMinute) * 60_000;
  return midnight + hour * 3_600_000;
}

/**
 * Gaps when neither person has anything planned, per day, inside typical
 * conference hours. Only days where at least one of them has a session count.
 */
export function commonFreeSlots(
  mine: ResolvedAgendaItem[],
  theirs: ResolvedAgendaItem[],
  { dayStartHour = 8, dayEndHour = 18, minimumMinutes = 45 } = {},
): FreeSlot[] {
  const byDay = new Map<string, Interval[]>();
  for (const item of [...mine, ...theirs]) {
    const list = byDay.get(item.time.dateLabel) ?? [];
    list.push({ start: Date.parse(item.time.startAt), end: Date.parse(item.time.endAt) });
    byDay.set(item.time.dateLabel, list);
  }

  const slots: FreeSlot[] = [];
  for (const [dateLabel, intervals] of byDay) {
    const busy = mergeIntervals(intervals);
    const dayStart = atHour(busy[0].start, dayStartHour);
    const dayEnd = atHour(busy[0].start, dayEndHour);
    let cursor = dayStart;
    for (const interval of busy) {
      if (interval.start - cursor >= minimumMinutes * 60_000) {
        slots.push({
          dateLabel,
          startAt: cursor,
          endAt: interval.start,
          minutes: Math.round((interval.start - cursor) / 60_000),
        });
      }
      cursor = Math.max(cursor, interval.end);
    }
    if (dayEnd - cursor >= minimumMinutes * 60_000) {
      slots.push({ dateLabel, startAt: cursor, endAt: dayEnd, minutes: Math.round((dayEnd - cursor) / 60_000) });
    }
  }
  return slots.sort((a, b) => a.startAt - b.startAt);
}
