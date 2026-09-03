import { useCallback, useLayoutEffect, useMemo } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { AgendaSyncBanner } from '../components/AgendaSyncBanner';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { EmptyState } from '../components/EmptyState';
import { HeaderButton } from '../components/HeaderButton';
import { Icon } from '../components/Icon';
import { icons } from '../components/icons';
import { LiveCard } from '../components/LiveCard';
import { PrimaryButton } from '../components/PrimaryButton';
import type { RowPosition } from '../components/SessionRow';
import { useAgendaActions, useAgendaState } from '../contexts/AgendaContext';
import { overlappingTimes, weekday } from '../data/catalog';
import { showActions } from '../lib/actions';
import { removeWithFeedback } from '../lib/agenda-actions';
import { exportAgendaToCalendar } from '../lib/calendar';
import { liveSnapshot, tightTransitions } from '../lib/live';
import { useNow } from '../lib/use-now';
import type { AgendaScreenProps } from '../navigation';
import { colors, hairline, radii, spacing, text } from '../theme';
import type { ResolvedAgendaItem } from '../types';

type AgendaRow = ResolvedAgendaItem & {
  position: RowPosition;
  conflictsWith: ResolvedAgendaItem | null;
  tight: { walk: number; gap: number } | null;
};

type DaySection = { title: string; subtitle: string; data: AgendaRow[] };

export function AgendaScreen({ navigation }: AgendaScreenProps) {
  const { resolved, hydrated } = useAgendaState();
  const actions = useAgendaActions();
  const now = useNow();

  const live = useMemo(() => liveSnapshot(resolved, now), [now, resolved]);

  const sections = useMemo<DaySection[]>(() => {
    const tight = tightTransitions(resolved);
    const grouped = new Map<string, AgendaRow[]>();
    resolved.forEach((item, index) => {
      const conflict =
        resolved.find(
          (candidate, candidateIndex) =>
            candidateIndex !== index && overlappingTimes(item.time, candidate.time),
        ) ?? null;
      const flag = tight.get(item.time.id);
      const rows = grouped.get(item.time.dateLabel) ?? [];
      rows.push({
        ...item,
        position: 'middle',
        conflictsWith: conflict,
        tight: flag ? { walk: flag.walk, gap: flag.gap } : null,
      });
      grouped.set(item.time.dateLabel, rows);
    });
    return [...grouped.entries()].map(([dateLabel, rows]) => {
      rows.forEach((row, index) => {
        row.position =
          rows.length === 1 ? 'single' : index === 0 ? 'first' : index === rows.length - 1 ? 'last' : 'middle';
      });
      const [, date] = dateLabel.split(', ');
      return { title: weekday(dateLabel), subtitle: `${date} · ${rows.length} ${rows.length === 1 ? 'session' : 'sessions'}`, data: rows };
    });
  }, [resolved]);

  const exportAll = useCallback(() => {
    showActions({
      title: 'Add to Calendar',
      message: `Create ${resolved.length} events in your default calendar with 15-minute alerts.`,
      options: [
        {
          label: `Add ${resolved.length} ${resolved.length === 1 ? 'session' : 'sessions'}`,
          onPress: () => {
            exportAgendaToCalendar(resolved)
              .then((count) => Alert.alert('Added to Calendar', `${count} ${count === 1 ? 'event' : 'events'} created.`))
              .catch((error) => Alert.alert('Could not add to Calendar', (error as Error).message));
          },
        },
      ],
    });
  }, [resolved]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        resolved.length ? (
          <HeaderButton accessibilityLabel="Add agenda to Calendar" icon={icons.calendarAdd} onPress={exportAll} />
        ) : null,
    });
  }, [exportAll, navigation, resolved.length]);

  const openItem = useCallback(
    (item: ResolvedAgendaItem) =>
      navigation.navigate('SessionDetail', { sessionId: item.session.id, sessionTimeId: item.time.id }),
    [navigation],
  );

  return (
    <SectionList
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyExtractor={(item) => item.time.id}
      ListEmptyComponent={
        hydrated ? (
          <EmptyState
            body="Add sessions from Browse and they will show up here, grouped by day."
            icon={icons.calendar}
            title="Nothing planned yet"
          >
            <PrimaryButton
              compact
              onPress={() => navigation.navigate('Main', { screen: 'Browse', params: { screen: 'BrowseHome' } })}
              style={styles.emptyButton}
              title="Browse sessions"
              variant="tinted"
            />
          </EmptyState>
        ) : null
      }
      ListFooterComponent={resolved.length ? <View style={styles.footer}><DisclaimerFooter /></View> : null}
      ListHeaderComponent={
        <View style={styles.header}>
          <AgendaSyncBanner />
          {live.live ? <LiveCard onOpen={openItem} snapshot={live} /> : null}
        </View>
      }
      renderItem={({ item }) => (
        <AgendaItemRow
          item={item}
          onOpen={() => openItem(item)}
          onRemove={() => removeWithFeedback(actions, item.time.id)}
          onResolve={() => navigation.navigate('ConflictResolver', { sessionTimeId: item.time.id })}
        />
      )}
      renderSectionHeader={({ section }) => (
        <View style={styles.dayHeader}>
          <Text style={text.title3}>{section.title}</Text>
          <Text style={text.footnoteSecondary}>{section.subtitle}</Text>
        </View>
      )}
      sections={sections}
      stickySectionHeadersEnabled={false}
    />
  );
}

function AgendaItemRow({
  item,
  onOpen,
  onRemove,
  onResolve,
}: {
  item: AgendaRow;
  onOpen: () => void;
  onRemove: () => void;
  onResolve: () => void;
}) {
  return (
    <View style={[styles.rowWrap, positionStyles[item.position]]}>
      <ReanimatedSwipeable
        friction={2}
        overshootRight={false}
        renderRightActions={() => (
          <Pressable
            accessibilityLabel="Remove from agenda"
            accessibilityRole="button"
            onPress={onRemove}
            style={styles.deleteAction}
          >
            <Icon {...icons.trash} color={colors.white} size={22} />
            <Text style={styles.deleteLabel}>Remove</Text>
          </Pressable>
        )}
        rightThreshold={48}
      >
        <Pressable
          accessibilityHint="Opens session details"
          accessibilityRole="button"
          onPress={onOpen}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.timeColumn}>
            <Text style={[text.subheadline, styles.startTime]}>{item.time.startTime}</Text>
            <Text style={text.caption1Secondary}>{item.time.endTime}</Text>
          </View>
          <View style={styles.copy}>
            <Text numberOfLines={2} style={text.headline}>
              {item.session.title}
            </Text>
            <Text numberOfLines={1} style={text.footnoteSecondary}>
              {item.time.location}
            </Text>
            {item.conflictsWith ? (
              <Pressable
                accessibilityHint="Shows other times for either session"
                accessibilityLabel={`Overlaps with ${item.conflictsWith.session.title}. Resolve`}
                accessibilityRole="button"
                hitSlop={6}
                onPress={onResolve}
                style={({ pressed }) => [styles.flag, pressed && styles.pressed]}
              >
                <Icon {...icons.warning} color={colors.red} size={13} />
                <Text numberOfLines={1} style={[text.footnote, styles.flagConflict]}>
                  Overlaps “{item.conflictsWith.session.title}”
                </Text>
                <Text style={[text.footnote, styles.resolve]}>Resolve</Text>
              </Pressable>
            ) : null}
            {item.tight ? (
              <View style={styles.flag}>
                <Icon {...icons.walk} color={colors.orange} size={13} />
                <Text style={[text.footnote, styles.flagTight]}>
                  About {item.tight.walk} min walk, {item.tight.gap} min gap
                </Text>
              </View>
            ) : null}
          </View>
          <Icon {...icons.chevron} color={colors.tertiaryLabel} size={14} weight="semibold" />
        </Pressable>
      </ReanimatedSwipeable>
      {item.position === 'first' || item.position === 'middle' ? <View style={styles.separator} /> : null}
    </View>
  );
}

const positionStyles = StyleSheet.create({
  single: { borderRadius: radii.lg },
  first: { borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg },
  middle: {},
  last: { borderBottomLeftRadius: radii.lg, borderBottomRightRadius: radii.lg },
});

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, flexGrow: 1 },
  header: { paddingHorizontal: 0, paddingTop: spacing.sm, gap: spacing.md },
  footer: { paddingTop: spacing.xl },
  emptyButton: { marginTop: spacing.md },
  dayHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    gap: 1,
  },
  rowWrap: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.7 },
  timeColumn: { width: 62, gap: 1 },
  startTime: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  copy: { flex: 1, gap: 2 },
  flag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  flagConflict: { color: colors.red, flexShrink: 1 },
  flagTight: { color: colors.orange, flexShrink: 1 },
  resolve: { color: colors.tint, fontWeight: '600' },
  separator: { height: hairline, backgroundColor: colors.separator, marginLeft: spacing.lg + 62 + spacing.md },
  deleteAction: {
    width: 88,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  deleteLabel: { ...text.caption1, color: colors.white, fontWeight: '600' },
});
