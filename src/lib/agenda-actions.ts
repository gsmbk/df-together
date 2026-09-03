import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import type { AgendaActions } from '../contexts/AgendaContext';
import type { DreamforceSession, SessionTime } from '../types';
import { timeRange } from '../data/catalog';

function reportFailure(error: unknown) {
  Alert.alert('Could not save agenda', (error as Error).message);
}

/**
 * Add an occurrence to the agenda, warning first when it overlaps something
 * already planned. Shared by Browse rows, the detail screen, and the resolver.
 */
export function addWithConflictCheck(
  actions: AgendaActions,
  session: DreamforceSession,
  time: SessionTime,
) {
  const perform = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    actions.add({ sessionId: session.id, sessionTimeId: time.id }).catch(reportFailure);
  };
  const conflicts = actions.findConflicts(time);
  if (!conflicts.length) return perform();
  const first = conflicts[0];
  Alert.alert(
    'This overlaps another session',
    `“${first.session.title}” runs ${timeRange(first.time)} on ${first.time.dateLabel}. You can keep both and sort it out later from your agenda.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Keep both', onPress: perform },
    ],
  );
}

export function removeWithFeedback(actions: AgendaActions, sessionTimeId: string) {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  actions.remove(sessionTimeId).catch(reportFailure);
}

/** Quick action for a row: single-occurrence sessions toggle, others open detail. */
export function quickToggle(
  actions: AgendaActions,
  session: DreamforceSession,
  onOpen: () => void,
) {
  if (session.times.length !== 1) return onOpen();
  const time = session.times[0];
  if (actions.isSelected(time.id)) {
    removeWithFeedback(actions, time.id);
  } else {
    addWithConflictCheck(actions, session, time);
  }
}
