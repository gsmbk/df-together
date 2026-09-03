import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { timeRange } from '../data/catalog';
import type { ResolvedAgendaItem } from '../types';

const REMINDER_PREFIX = 'agenda-';
/** iOS keeps at most 64 pending local notifications per app. */
const MAX_SCHEDULED = 60;

let handlerInstalled = false;

export function installNotificationHandler() {
  if (handlerInstalled) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain && current.status !== 'undetermined') return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function identifierFor(sessionTimeId: string) {
  return `${REMINDER_PREFIX}${sessionTimeId}`;
}

/**
 * Bring scheduled reminders in line with the agenda: one reminder per future
 * occurrence, `leadMinutes` before it starts. Idempotent; safe to call often.
 */
export async function syncReminders(items: ResolvedAgendaItem[], leadMinutes: number, enabled: boolean) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existing = new Map(
    scheduled
      .filter((request) => request.identifier.startsWith(REMINDER_PREFIX))
      .map((request) => [request.identifier, request] as const),
  );

  if (!enabled) {
    await Promise.all([...existing.keys()].map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    return;
  }

  const now = Date.now();
  const wanted = items
    .map((item) => ({ item, fireAt: Date.parse(item.time.startAt) - leadMinutes * 60_000 }))
    .filter(({ fireAt }) => fireAt > now)
    .sort((a, b) => a.fireAt - b.fireAt)
    .slice(0, MAX_SCHEDULED);
  const wantedIds = new Set(wanted.map(({ item }) => identifierFor(item.time.id)));

  const cancellations = [...existing.keys()]
    .filter((id) => !wantedIds.has(id))
    .map((id) => Notifications.cancelScheduledNotificationAsync(id));

  const additions = wanted
    .filter(({ item, fireAt }) => {
      const request = existing.get(identifierFor(item.time.id));
      if (!request) return true;
      const trigger = request.trigger as { type?: string; value?: number; date?: number } | null;
      const scheduledAt = trigger?.value ?? trigger?.date;
      return typeof scheduledAt !== 'number' || Math.abs(scheduledAt - fireAt) > 60_000;
    })
    .map(({ item, fireAt }) =>
      Notifications.scheduleNotificationAsync({
        identifier: identifierFor(item.time.id),
        content: {
          title: `${leadMinutes} min until ${item.session.title}`,
          body: `${timeRange(item.time)} · ${item.time.location}`,
          data: { sessionId: item.session.id, sessionTimeId: item.time.id },
          sound: 'default',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
      }),
    );

  await Promise.all([...cancellations, ...additions]);
}
