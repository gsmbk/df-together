import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { Cell, GroupedSection, Row } from '../components/GroupedList';
import { Icon } from '../components/Icon';
import { icons } from '../components/icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAgendaState } from '../contexts/AgendaContext';
import { resolveSelections, shortDay, weekday } from '../data/catalog';
import { commonFreeSlots } from '../lib/free-time';
import { formatClock } from '../lib/live';
import { loadFriendAgenda } from '../lib/social';
import type { RootScreenProps } from '../navigation';
import { useSocial } from '../state/social';
import { colors, spacing, text } from '../theme';
import type { AgendaSelection, ResolvedAgendaItem } from '../types';

export function FriendAgendaScreen({ navigation, route }: RootScreenProps<'FriendAgenda'>) {
  const { friendId, friendName } = route.params;
  const { selectedTimeIds, resolved: mine } = useAgendaState();
  const { snapshot } = useSocial();
  const friend = snapshot.friends.find(({ profile }) => profile.id === friendId)?.profile;
  const [items, setItems] = useState<AgendaSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);
    loadFriendAgenda(friendId)
      .then((next) => {
        if (!cancelled) setItems(next);
      })
      .catch((error) => {
        if (!cancelled) setErrorMessage((error as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [friendId, reloadCount]);

  const theirs = useMemo(() => resolveSelections(items), [items]);
  const mySessionIds = useMemo(() => new Set(mine.map((item) => item.session.id)), [mine]);
  const togetherCount = theirs.filter((item) => selectedTimeIds.has(item.time.id)).length;
  const freeSlots = useMemo(() => (theirs.length ? commonFreeSlots(mine, theirs) : []), [mine, theirs]);

  const days = useMemo(() => {
    const grouped = new Map<string, ResolvedAgendaItem[]>();
    for (const item of theirs) grouped.set(item.time.dateLabel, [...(grouped.get(item.time.dateLabel) ?? []), item]);
    return [...grouped.entries()];
  }, [theirs]);

  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.hero}>
        <Avatar color={friend?.avatar_color} name={friendName} size={64} />
        <Text style={text.title2}>{friendName}</Text>
        <Text style={text.subheadlineSecondary}>
          {loading
            ? 'Loading shared agenda…'
            : theirs.length
              ? `${theirs.length} ${theirs.length === 1 ? 'session' : 'sessions'} · ${togetherCount} together`
              : 'Nothing shared yet'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.tint} />
      ) : errorMessage ? (
        <EmptyState
          body="Check your connection and try again. We couldn’t tell whether their agenda is empty or private."
          icon={icons.cloudOffline}
          title="Couldn’t load this agenda"
        >
          <Text selectable style={[text.caption1Secondary, styles.center]}>
            {errorMessage}
          </Text>
          <PrimaryButton compact icon={icons.refresh} onPress={() => setReloadCount((count) => count + 1)} title="Try again" variant="tinted" />
        </EmptyState>
      ) : !theirs.length ? (
        <EmptyState
          body="Their agenda is empty or still private. They control sharing from their profile."
          icon={icons.lock}
          title="Nothing shared yet"
        />
      ) : (
        <>
          {freeSlots.length ? (
            <GroupedSection
              footer="Gaps between 8 AM and 6 PM when neither of you has a session."
              header="You’re both free"
            >
              {freeSlots.slice(0, 6).map((slot) => (
                <Row
                  detail={`${slot.minutes} min`}
                  key={`${slot.dateLabel}-${slot.startAt}`}
                  leading={<Icon {...icons.coffee} color={colors.tint} size={20} />}
                  title={`${shortDay(slot.dateLabel)} · ${formatClock(new Date(slot.startAt))}–${formatClock(new Date(slot.endAt))}`}
                />
              ))}
            </GroupedSection>
          ) : null}

          {days.map(([dateLabel, dayItems]) => (
            <GroupedSection header={`${weekday(dateLabel)} · ${dateLabel.split(', ')[1]}`} key={dateLabel}>
              {dayItems.map(({ session, time }) => {
                const together = selectedTimeIds.has(time.id);
                const sameSession = !together && mySessionIds.has(session.id);
                return (
                  <Cell key={time.id} style={styles.item}>
                    <View style={styles.itemRow}>
                      <View style={styles.timeColumn}>
                        <Text style={[text.subheadline, styles.startTime]}>{time.startTime}</Text>
                        <Text style={text.caption1Secondary}>{time.endTime}</Text>
                      </View>
                      <View style={styles.flex}>
                        <Text
                          onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id, sessionTimeId: time.id })}
                          style={text.headline}
                        >
                          {session.title}
                        </Text>
                        <Text numberOfLines={1} style={text.footnoteSecondary}>
                          {time.location}
                        </Text>
                        {together ? (
                          <View style={styles.badgeRow}>
                            <Chip label="You’re both going" tone="green" />
                          </View>
                        ) : sameSession ? (
                          <View style={styles.badgeRow}>
                            <Chip label="On your agenda at another time" tone="neutral" />
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </Cell>
                );
              })}
            </GroupedSection>
          ))}
          <Text style={[text.footnoteSecondary, styles.center]}>Times are shown in Pacific time.</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  center: { textAlign: 'center' },
  flex: { flex: 1 },
  item: { paddingVertical: spacing.md },
  itemRow: { flexDirection: 'row', gap: spacing.md },
  timeColumn: { width: 62, gap: 1 },
  startTime: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  badgeRow: { marginTop: 6 },
});
