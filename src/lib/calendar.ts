import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { catalog } from '../data/catalog';
import { eventTimeZone } from './live';
import type { ResolvedAgendaItem } from '../types';

function notes(item: ResolvedAgendaItem) {
  const lines = [item.session.abstract.trim()];
  if (item.time.seating) lines.push(`Seating: ${item.time.seating}`);
  lines.push(`Official page: ${item.session.officialUrl}`);
  lines.push(`Added from DF Together. ${catalog.metadata.disclaimer}`);
  return lines.join('\n\n');
}

async function ensureCalendarAccess() {
  const permission = await Calendar.requestCalendarPermissions();
  if (!permission.granted) {
    throw new Error('Calendar access is off. Allow it in Settings to add sessions.');
  }
}

/** Open the system "New Event" sheet pre-filled with one occurrence. */
export async function addToCalendarWithForm(item: ResolvedAgendaItem) {
  if (Platform.OS === 'web') throw new Error('Calendar export is not available on web.');
  await ensureCalendarAccess();
  const calendar = Calendar.getDefaultCalendarSync();
  const result = await calendar.addEventWithForm({
    title: item.session.title,
    startDate: new Date(item.time.startAt),
    endDate: new Date(item.time.endAt),
    location: item.time.location,
    notes: notes(item),
  });
  return result.action;
}

/**
 * Silently add every agenda item to the default calendar with a 15-minute
 * alert. Returns how many events were created.
 */
export async function exportAgendaToCalendar(items: ResolvedAgendaItem[]) {
  if (Platform.OS === 'web') throw new Error('Calendar export is not available on web.');
  await ensureCalendarAccess();
  const calendar = Calendar.getDefaultCalendarSync();
  let created = 0;
  for (const item of items) {
    await calendar.createEvent({
      title: item.session.title,
      startDate: new Date(item.time.startAt),
      endDate: new Date(item.time.endAt),
      location: item.time.location,
      notes: notes(item),
      timeZone: eventTimeZone,
      url: item.session.officialUrl,
      alarms: [{ relativeOffset: -15 }],
    });
    created += 1;
  }
  return created;
}
