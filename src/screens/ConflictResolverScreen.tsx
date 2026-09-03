import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cell, GroupedSection, Row } from '../components/GroupedList';
import { EmptyState } from '../components/EmptyState';
import { icons } from '../components/icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAgendaActions, useAgendaState } from '../contexts/AgendaContext';
import { overlappingTimes, shortDay, timeIndex, timeRange } from '../data/catalog';
import { removeWithFeedback } from '../lib/agenda-actions';
import type { RootScreenProps } from '../navigation';
import { colors, spacing, text } from '../theme';
import type { ResolvedAgendaItem, SessionTime } from '../types';

export function ConflictResolverScreen({ navigation, route }: RootScreenProps<'ConflictResolver'>) {
  const { resolved } = useAgendaState();
  const actions = useAgendaActions();
  const anchor = timeIndex.get(route.params.sessionTimeId) ?? null;

  const group = useMemo(() => {
    if (!anchor) return [];
    const overlapping = resolved.filter((item) => overlappingTimes(item.time, anchor.time));
    return overlapping.some((item) => item.time.id === anchor.time.id) ? overlapping : [anchor, ...overlapping];
  }, [anchor, resolved]);

  if (!anchor || group.length < 2) {
    return (
      <EmptyState
        body="Nothing on your agenda overlaps this session anymore."
        icon={icons.added}
        style={styles.empty}
        title="No overlap"
      />
    );
  }

  const alternativesFor = (item: ResolvedAgendaItem) =>
    item.session.times.filter(
      (time) =>
        time.id !== item.time.id &&
        !actions.isSelected(time.id) &&
        actions.findConflicts(time, item.time.id).length === 0,
    );

  const switchTo = (item: ResolvedAgendaItem, time: SessionTime) => {
    actions
      .swap(item.time.id, { sessionId: item.session.id, sessionTimeId: time.id })
      .then(() => navigation.goBack())
      .catch((error) => Alert.alert('Could not update agenda', (error as Error).message));
  };

  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <Text style={[text.footnoteSecondary, styles.intro]}>
        These sessions overlap on {anchor.time.dateLabel}. Switch one to another time, or keep both and decide on the day.
      </Text>
      {group.map((item) => {
        const alternatives = alternativesFor(item);
        return (
          <GroupedSection
            footer={
              alternatives.length
                ? 'Only times that do not clash with the rest of your agenda are shown.'
                : 'This session has no other time that fits your agenda.'
            }
            header={`${shortDay(item.time.dateLabel)} · ${timeRange(item.time)}`}
            key={item.time.id}
          >
            <Cell>
              <Text style={text.headline}>{item.session.title}</Text>
              <Text style={text.footnoteSecondary}>{item.time.location}</Text>
            </Cell>
            {alternatives.map((time) => (
              <Row
                key={time.id}
                onPress={() => switchTo(item, time)}
                subtitle={time.location}
                title={`${shortDay(time.dateLabel)} · ${timeRange(time)}`}
                trailing={
                  <PrimaryButton compact icon={icons.swap} onPress={() => switchTo(item, time)} title="Switch" variant="tinted" />
                }
              />
            ))}
            <Row
              destructive
              onPress={() => {
                removeWithFeedback(actions, item.time.id);
                navigation.goBack();
              }}
              title="Remove from agenda"
            />
          </GroupedSection>
        );
      })}
      <View style={styles.keep}>
        <PrimaryButton onPress={() => navigation.goBack()} title="Keep both" variant="gray" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.xl },
  intro: { paddingHorizontal: spacing.xs, color: colors.secondaryLabel },
  empty: { flex: 1, justifyContent: 'center' },
  keep: { paddingTop: spacing.sm },
});
