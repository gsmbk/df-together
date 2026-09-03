import { sessions, timeIndex } from '../data/catalog';
import type { DreamforceSession, ResolvedAgendaItem, SessionTime } from '../types';

/**
 * Reconciling the official Dreamforce agenda with this app's plan.
 *
 * There is no API we can call. Adding a session on the official catalog goes
 * through Salesforce's own Trailblazer ID login with a first-party OAuth
 * client, and RainFocus grants API access to the event host, not to attendees
 * or third-party apps. So DF Together can never create or cancel a real
 * reservation.
 *
 * What we can do: the official Salesforce Events app writes a built agenda
 * into the phone's native calendar. If someone has done that, those events sit
 * in the iOS Calendar where we may read them. We match them back to the
 * bundled catalog and report the differences. This is one-way and read-only.
 */

/** Marker written into notes by our own calendar export, so we never re-import it. */
export const APP_EVENT_MARKER = 'Added from DF Together';

/** A calendar event reduced to only what matching needs. */
export type CalendarEventLike = {
  id?: string;
  title?: string | null;
  notes?: string | null;
  location?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
};

export type ReconciledStatus =
  /** Reserved on Salesforce and already planned here. */
  | 'planned'
  /** Reserved on Salesforce but missing from this app's agenda. */
  | 'unplanned'
  /** Matched by title, but the calendar time differs from the bundled catalog. */
  | 'timeChanged';

export type ReconciledEntry = {
  session: DreamforceSession;
  time: SessionTime;
  status: ReconciledStatus;
  /** Start time recorded in the phone's calendar, epoch milliseconds. */
  calendarStartAt: number;
  /** Minutes between the calendar entry and the catalog occurrence. */
  driftMinutes: number;
};

export type Reconciliation = {
  /** Calendar entries examined inside the event window. */
  scanned: number;
  /** Entries we could tie to a catalog session. */
  matched: ReconciledEntry[];
  /** Planned here with no matching entry in the phone's calendar. */
  missingReservation: ResolvedAgendaItem[];
  checkedAt: string;
};

/** Titles vary in punctuation and spacing between systems, so compare loosely. */
export function normalizeTitle(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Occurrences within this many minutes count as the same booking. */
const SAME_TIME_MINUTES = 5;
/** Shorter normalized titles are too generic for a substring match. */
const SUBSTRING_MIN_LENGTH = 25;

const titleIndex = (() => {
  const index = new Map<string, DreamforceSession[]>();
  for (const session of sessions) {
    const key = normalizeTitle(session.title);
    if (!key) continue;
    const existing = index.get(key);
    if (existing) existing.push(session);
    else index.set(key, [session]);
  }
  return index;
})();

function toMillis(value: Date | string | null | undefined) {
  if (!value) return Number.NaN;
  return value instanceof Date ? value.getTime() : Date.parse(value);
}

/** Candidate sessions for a calendar title, exact first then substring. */
function candidatesFor(normalized: string) {
  const exact = titleIndex.get(normalized);
  if (exact?.length) return exact;
  if (normalized.length < SUBSTRING_MIN_LENGTH) return [];

  const matches: DreamforceSession[] = [];
  for (const [key, group] of titleIndex) {
    if (key.length < SUBSTRING_MIN_LENGTH) continue;
    if (normalized.includes(key) || key.includes(normalized)) matches.push(...group);
  }
  // Ambiguous substring hits are worse than no answer.
  return matches.length === 1 ? matches : [];
}

/**
 * Tie one calendar entry to a catalog occurrence. Returns the occurrence whose
 * start is closest to the calendar entry, or null when nothing matches.
 */
export function matchCalendarEvent(event: CalendarEventLike) {
  if (event.notes?.includes(APP_EVENT_MARKER)) return null;
  const title = event.title?.trim();
  if (!title) return null;
  const startAt = toMillis(event.startDate);
  if (Number.isNaN(startAt)) return null;

  const candidates = candidatesFor(normalizeTitle(title));
  if (!candidates.length) return null;

  let best: { session: DreamforceSession; time: SessionTime; drift: number } | null = null;
  for (const session of candidates) {
    for (const time of session.times) {
      const drift = Math.abs(Date.parse(time.startAt) - startAt) / 60_000;
      if (!best || drift < best.drift) best = { session, time, drift };
    }
  }
  if (!best) return null;
  return { session: best.session, time: best.time, driftMinutes: Math.round(best.drift), calendarStartAt: startAt };
}

/**
 * Compare calendar entries against the agenda planned in this app.
 *
 * `plannedTimeIds` are the occurrence ids currently on the DF Together agenda.
 * Anything that does not match a catalog session is dropped rather than kept,
 * so unrelated personal events never enter app state.
 */
export function reconcile(
  events: CalendarEventLike[],
  planned: ResolvedAgendaItem[],
  now: Date = new Date(),
): Reconciliation {
  const plannedTimeIds = new Set(planned.map((item) => item.time.id));
  const matched: ReconciledEntry[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    const match = matchCalendarEvent(event);
    if (!match) continue;
    if (seen.has(match.time.id)) continue;
    seen.add(match.time.id);

    const sameTime = match.driftMinutes <= SAME_TIME_MINUTES;
    const status: ReconciledStatus = !sameTime
      ? 'timeChanged'
      : plannedTimeIds.has(match.time.id)
        ? 'planned'
        : 'unplanned';

    matched.push({
      session: match.session,
      time: match.time,
      status,
      calendarStartAt: match.calendarStartAt,
      driftMinutes: match.driftMinutes,
    });
  }

  matched.sort((a, b) => a.time.startAt.localeCompare(b.time.startAt));

  // A session counts as covered when any of its occurrences showed up.
  const coveredSessionIds = new Set(matched.map((entry) => entry.session.id));
  const missingReservation = planned.filter((item) => !coveredSessionIds.has(item.session.id));

  return {
    scanned: events.length,
    matched,
    missingReservation,
    checkedAt: now.toISOString(),
  };
}

/** Occurrence ids that appear to be booked on the official agenda. */
export function reservedTimeIds(reconciliation: Reconciliation | null) {
  if (!reconciliation) return new Set<string>();
  return new Set(reconciliation.matched.map((entry) => entry.time.id));
}

/** Resolve a stored occurrence id back to its catalog entry. */
export function resolveTimeId(sessionTimeId: string) {
  return timeIndex.get(sessionTimeId) ?? null;
}
