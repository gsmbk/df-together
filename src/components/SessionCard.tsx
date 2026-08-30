import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAgenda } from '../contexts/AgendaContext';
import {
  earliestTime,
  overlappingTimes,
  timeIndex,
} from '../data/catalog';
import { colors, radii, shadow, spacing } from '../theme';
import type { DreamforceSession, SessionTime } from '../types';
import { Chip } from './Chip';

type Props = {
  session: DreamforceSession;
  onOpen: () => void;
};

export const SessionCard = memo(function SessionCard({ session, onOpen }: Props) {
  const { add, remove, selections, isSelected } = useAgenda();
  const time = earliestTime(session);
  const selected = session.times.some((item) => isSelected(item.id));

  const addOccurrence = (occurrence: SessionTime) => {
    const conflicts = selections
      .map((selection) => timeIndex.get(selection.sessionTimeId))
      .filter((item) => item && overlappingTimes(item.time, occurrence));
    const perform = () => {
      Haptics.selectionAsync();
      add({ sessionId: session.id, sessionTimeId: occurrence.id }).catch((error) =>
        Alert.alert('Could not save agenda', (error as Error).message),
      );
    };
    if (!conflicts.length) return perform();
    Alert.alert(
      'Time conflict',
      `This overlaps with “${conflicts[0]?.session.title}”. You can keep both and decide later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Keep both', onPress: perform },
      ],
    );
  };

  const quickAction = () => {
    if (session.times.length !== 1) return onOpen();
    if (selected) {
      remove(time.id).catch((error) =>
        Alert.alert('Could not save agenda', (error as Error).message),
      );
    } else {
      addOccurrence(time);
    }
  };

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <View style={styles.chips}>
          {session.formats[0] ? <Chip label={session.formats[0]} /> : null}
          {session.levels[0] ? (
            <Chip label={session.levels[0]} tone="purple" />
          ) : null}
        </View>
        <Pressable
          accessibilityLabel={selected ? 'Remove from agenda' : 'Add to agenda'}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            quickAction();
          }}
          style={[styles.addButton, selected && styles.addButtonSelected]}
        >
          <Ionicons
            color={selected ? colors.white : colors.blueBright}
            name={selected ? 'checkmark' : 'add'}
            size={22}
          />
        </Pressable>
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {session.title}
      </Text>
      <Text numberOfLines={2} style={styles.abstract}>
        {session.abstract}
      </Text>

      <View style={styles.meta}>
        <Ionicons color={colors.blue} name="calendar-outline" size={16} />
        <Text style={styles.metaText}>
          {time.dateLabel} · {time.startTime}–{time.endTime}
        </Text>
      </View>
      <View style={styles.meta}>
        <Ionicons color={colors.blue} name="location-outline" size={16} />
        <Text numberOfLines={1} style={styles.metaText}>
          {time.location}
        </Text>
      </View>
      {session.times.length > 1 ? (
        <Text style={styles.moreTimes}>
          +{session.times.length - 1} more {session.times.length === 2 ? 'time' : 'times'}
        </Text>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  pressed: { opacity: 0.82 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  addButtonSelected: { backgroundColor: colors.green },
  title: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  abstract: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  metaText: { flex: 1, color: colors.inkMuted, fontSize: 13, fontWeight: '600' },
  moreTimes: { color: colors.blue, fontSize: 12, fontWeight: '800', marginTop: spacing.sm },
});
