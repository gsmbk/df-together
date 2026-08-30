import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../components/BrandMark';
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
            <LinearGradient
              colors={[colors.blueVivid, colors.blueBright, colors.blue]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.hero}
            >
              <View style={styles.heroOrbLarge} />
              <View style={styles.heroOrbSmall} />
              <View style={styles.heroTopline}>
                <BrandMark inverted size={42} />
                <View style={styles.heroBrandCopy}>
                  <Text style={styles.heroBrand}>DF TOGETHER</Text>
                  <Text style={styles.heroDate}>DREAMFORCE 2026 · SEP 15–17</Text>
                </View>
                <View style={styles.offlinePill}>
                  <View style={styles.offlineDot} />
                  <Text style={styles.offlineText}>OFFLINE</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Build your Dreamforce, together.</Text>
              <Text style={styles.heroBody}>
                {catalog.metadata.sessionCount.toLocaleString()} sessions on-device. Find
                your plan, then find your people.
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
  hero: {
    position: 'relative',
    overflow: 'hidden',
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    gap: spacing.md,
    boxShadow: '0 16px 34px rgba(1, 118, 211, 0.2)',
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -84,
    top: -104,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    right: 52,
    bottom: -52,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroTopline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroBrandCopy: { flex: 1, gap: 2 },
  heroBrand: { color: colors.white, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  heroDate: { color: '#D8EFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,45,96,0.3)',
  },
  offlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.greenBright },
  offlineText: { color: colors.white, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  heroTitle: { color: colors.white, fontSize: 30, lineHeight: 35, fontWeight: '900' },
  heroBody: { color: '#EAF7FF', fontSize: 14, lineHeight: 20 },
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
    boxShadow: '0 6px 18px rgba(3, 45, 96, 0.06)',
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
    boxShadow: '0 6px 18px rgba(3, 45, 96, 0.06)',
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
