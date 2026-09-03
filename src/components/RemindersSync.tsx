import { useEffect } from 'react';
import { useAgendaState } from '../contexts/AgendaContext';
import { installNotificationHandler, syncReminders } from '../lib/reminders';
import { usePreferences } from '../state/preferences';

/** Keeps local reminder notifications in step with the agenda and preferences. */
export function RemindersSync() {
  const { resolved, hydrated } = useAgendaState();
  const { remindersEnabled, reminderLeadMinutes } = usePreferences();

  useEffect(() => {
    installNotificationHandler();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      syncReminders(resolved, reminderLeadMinutes, remindersEnabled).catch(() => undefined);
    }, 600);
    return () => clearTimeout(timer);
  }, [hydrated, reminderLeadMinutes, remindersEnabled, resolved]);

  return null;
}
