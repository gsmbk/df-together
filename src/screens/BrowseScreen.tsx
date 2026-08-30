import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { SessionCard } from '../components/SessionCard';
import {
  catalog,
  earliestTime,
  emptyFilters,
  sessionMatches,
  sessions,
} from '../data/catalog';
import type { RootStackParamList, TabParamList } from '../navigation';
import { colors, radii, spacing } from '../theme';
import { FiltersModal } from './FiltersModal';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Browse'>,
  NativeStackScreenProps<RootStackParamList>
>;

const dayOptions = [
  ...new Set(
    sessions
      .flatMap((session) => session.times)
      .sort((first, second) => first.startAt.localeCompare(second.startAt))
      .map((time) => time.dateLabel),
  ),
];

export function BrowseScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(emptyFilters());
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount = Object.values(filters).reduce(
    (total, values) => total + values.length,
    0,
  );

  const results = useMemo(
    () =>
      sessions
        .filter((session) => sessionMatches(session, query, filters))
        .sort((a, b) => earliestTime(a).startAt.localeCompare(earliestTime(b).startAt)),
    [filters, query],
  );

  const toggleDay = (day: string) => {
    setFilters((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((value) => value !== day)
        : [day],
    }));
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <FlashList
        data={results}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            body="Try clearing a filter or searching for a broader term."
            icon="search-outline"
            title="No matching sessions"
          />
        }
        ListHeaderComponent={
          <>
            <LinearGradient colors={[colors.navy, '#114B8A']} style={styles.hero}>
              <Text style={styles.eyebrow}>DREAMFORCE 2026 · SEP 15–17</Text>
              <Text style={styles.heroTitle}>Build your best three days.</Text>
              <Text style={styles.heroBody}>
                {catalog.metadata.sessionCount.toLocaleString()} sessions, available
                offline.
              </Text>
            </LinearGradient>

            <View style={styles.controls}>
              <View style={styles.searchBox}>
                <Ionicons color={colors.inkMuted} name="search" size={20} />
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setQuery}
                  placeholder="Search title, product, topic…"
                  placeholderTextColor={colors.inkMuted}
                  style={styles.searchInput}
                  value={query}
                />
                {query ? (
                  <Pressable onPress={() => setQuery('')}>
                    <Ionicons color={colors.inkMuted} name="close-circle" size={20} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel="Open session filters"
                onPress={() => setShowFilters(true)}
                style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
              >
                <Ionicons
                  color={activeFilterCount ? colors.white : colors.blue}
                  name="options-outline"
                  size={21}
                />
                {activeFilterCount ? (
                  <Text style={styles.filterCount}>{activeFilterCount}</Text>
                ) : null}
              </Pressable>
            </View>

            <View style={styles.days}>
              {dayOptions.map((day) => (
                <Chip
                  key={day}
                  label={day.replace(', Sep ', ' ')}
                  onPress={() => toggleDay(day)}
                  selected={filters.days.includes(day)}
                />
              ))}
            </View>
            <Text style={styles.resultCount}>{results.length.toLocaleString()} sessions</Text>
          </>
        }
        renderItem={({ item }) => (
          <SessionCard
            onOpen={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
            session={item}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      <FiltersModal
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilters(false)}
        visible={showFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  listContent: { paddingBottom: spacing.xl },
  hero: { margin: spacing.lg, padding: spacing.xl, borderRadius: radii.lg, gap: spacing.sm },
  eyebrow: { color: '#B8D9FF', fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  heroTitle: { color: colors.white, fontSize: 29, lineHeight: 34, fontWeight: '900' },
  heroBody: { color: '#DCEBFA', fontSize: 14, lineHeight: 20 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchBox: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: 15 },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterButtonActive: { backgroundColor: colors.blueBright, borderColor: colors.blueBright },
  filterCount: {
    position: 'absolute',
    right: -3,
    top: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.purple,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '900',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  resultCount: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
});
