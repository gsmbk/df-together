import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useCallback, useDeferredValue, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { HeaderButton } from '../components/HeaderButton';
import { icons } from '../components/icons';
import { SessionRow, type FriendHintLite, type RowPosition } from '../components/SessionRow';
import { useAgendaActions, useAgendaState } from '../contexts/AgendaContext';
import {
  countActiveFilters,
  dayOptions,
  earliestTime,
  sessionMatches,
  sessionMatchesInterests,
  shortDay,
  sortedSessions,
} from '../data/catalog';
import { quickToggle } from '../lib/agenda-actions';
import type { BrowseScreenProps } from '../navigation';
import { setFilterValues, useFilters } from '../state/browse';
import { hasInterests, updatePreferences, usePreferences } from '../state/preferences';
import { useFriendsGoing } from '../state/social';
import { colors, spacing, text } from '../theme';
import type { DreamforceSession } from '../types';

type ListItem =
  | { type: 'day'; key: string; title: string; count: number }
  | { type: 'session'; key: string; session: DreamforceSession; position: RowPosition };

const daySegments = ['All', ...dayOptions.map((day) => shortDay(day))];

export function BrowseScreen({ navigation }: BrowseScreenProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const filters = useFilters();
  const { interests, forYouEnabled } = usePreferences();
  const { resolved } = useAgendaState();
  const actions = useAgendaActions();
  const { bySession } = useFriendsGoing();
  const activeFilterCount = countActiveFilters(filters);
  const interestsSet = hasInterests(interests);
  const forYou = interestsSet && forYouEnabled;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: 'Sessions, products, topics',
        autoCapitalize: 'none',
        hideWhenScrolling: false,
        onChangeText: (event) => setQuery(event.nativeEvent.text),
        onCancelButtonPress: () => setQuery(''),
      },
      headerRight: () => (
        <HeaderButton
          accessibilityLabel={activeFilterCount ? `Filters, ${activeFilterCount} active` : 'Filters'}
          badge={activeFilterCount}
          icon={activeFilterCount ? icons.filterActive : icons.filter}
          onPress={() => navigation.navigate('Filters')}
        />
      ),
    });
  }, [activeFilterCount, navigation]);

  const selectedSessionIds = useMemo(
    () => new Set(resolved.map((item) => item.session.id)),
    [resolved],
  );

  const results = useMemo(() => {
    const matched = sortedSessions.filter(
      (session) =>
        sessionMatches(session, deferredQuery, filters) &&
        (!forYou || sessionMatchesInterests(session, interests)),
    );
    const items: ListItem[] = [];
    let index = 0;
    while (index < matched.length) {
      const day = dayOf(matched[index]);
      let end = index;
      while (end < matched.length && dayOf(matched[end]) === day) end += 1;
      const count = end - index;
      items.push({ type: 'day', key: `day-${day}`, title: day, count });
      for (let cursor = index; cursor < end; cursor += 1) {
        const session = matched[cursor];
        const position: RowPosition =
          count === 1 ? 'single' : cursor === index ? 'first' : cursor === end - 1 ? 'last' : 'middle';
        items.push({ type: 'session', key: session.id, session, position });
      }
      index = end;
    }
    return { items, count: matched.length };
  }, [deferredQuery, filters, forYou, interests]);

  const openSession = useCallback(
    (session: DreamforceSession) => navigation.navigate('SessionDetail', { sessionId: session.id }),
    [navigation],
  );

  const toggleSession = useCallback(
    (session: DreamforceSession) => quickToggle(actions, session, () => openSession(session)),
    [actions, openSession],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ListItem>) => {
      if (item.type === 'day') {
        return (
          <View style={styles.dayHeader}>
            <Text style={text.sectionHeader}>{item.title}</Text>
            <Text style={text.caption1Secondary}>{item.count.toLocaleString()}</Text>
          </View>
        );
      }
      return (
        <SessionRow
          friends={bySession.get(item.session.id) as FriendHintLite[] | undefined}
          onOpen={openSession}
          onToggle={toggleSession}
          position={item.position}
          selected={selectedSessionIds.has(item.session.id)}
          session={item.session}
        />
      );
    },
    [bySession, openSession, selectedSessionIds, toggleSession],
  );

  const selectedDayIndex = filters.days.length === 1 ? dayOptions.indexOf(filters.days[0]) + 1 : 0;

  return (
    <FlashList
      contentInsetAdjustmentBehavior="automatic"
      data={results.items}
      getItemType={(item) => item.type}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => item.key}
      ListEmptyComponent={
        <EmptyState
          body="Try a broader search or clear a filter."
          icon={icons.search}
          title="No sessions match"
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <SegmentedControl
            onChange={(event) => {
              const index = event.nativeEvent.selectedSegmentIndex;
              setFilterValues('days', index === 0 ? [] : [dayOptions[index - 1]]);
            }}
            selectedIndex={selectedDayIndex}
            values={daySegments}
          />
          <View style={styles.summaryRow}>
            <Text style={text.footnoteSecondary}>
              {results.count.toLocaleString()} {results.count === 1 ? 'session' : 'sessions'}
              {forYou ? ' for you' : ''}
            </Text>
            {interestsSet ? (
              <Chip
                label="For you"
                onPress={() => updatePreferences({ forYouEnabled: !forYouEnabled })}
                selected={forYouEnabled}
              />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('Interests')}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={[text.footnote, styles.link]}>Pick interests</Text>
              </Pressable>
            )}
          </View>
        </View>
      }
      renderItem={renderItem}
      contentContainerStyle={styles.content}
    />
  );
}

function dayOf(session: DreamforceSession) {
  return earliestTime(session).dateLabel;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  link: { color: colors.tint, fontWeight: '600' },
  pressed: { opacity: 0.5 },
});
