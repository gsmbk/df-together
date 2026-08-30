import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { EmptyState } from '../components/EmptyState';
import { useAgenda } from '../contexts/AgendaContext';
import { overlappingTimes, timeIndex } from '../data/catalog';
import type { RootStackParamList, TabParamList } from '../navigation';
import { colors, radii, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Agenda'>,
  NativeStackScreenProps<RootStackParamList>
>;

type AgendaItem = NonNullable<ReturnType<typeof timeIndex.get>> & { conflicted: boolean };

export function AgendaScreen({ navigation }: Props) {
  const { selections, remove } = useAgenda();
  const sections = useMemo(() => {
    const resolved = selections
      .map((selection) => timeIndex.get(selection.sessionTimeId))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.time.startAt.localeCompare(b.time.startAt));
    const withConflicts: AgendaItem[] = resolved.map((item, index) => ({
      ...item,
      conflicted: resolved.some(
        (candidate, candidateIndex) =>
          candidateIndex !== index && overlappingTimes(item.time, candidate.time),
      ),
    }));
    const grouped = new Map<string, AgendaItem[]>();
    for (const item of withConflicts) {
      grouped.set(item.time.dateLabel, [...(grouped.get(item.time.dateLabel) ?? []), item]);
    }
    return [...grouped.entries()].map(([title, data]) => ({ title, data }));
  }, [selections]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.time.id}
        ListEmptyComponent={
          <EmptyState
            body="Browse the catalog and tap + on sessions you want to attend."
            icon="calendar-outline"
            title="Your agenda is wide open"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>MY AGENDA</Text>
            <Text style={styles.title}>Your Dreamforce plan</Text>
            <Text style={styles.subtitle}>
              {selections.length} {selections.length === 1 ? 'session' : 'sessions'} selected
            </Text>
            <DisclaimerBanner compact />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('SessionDetail', { sessionId: item.session.id })
            }
            style={({ pressed }) => [
              styles.item,
              item.conflicted && styles.itemConflict,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.timeColumn}>
              <Text style={styles.startTime}>{item.time.startTime}</Text>
              <Text style={styles.endTime}>{item.time.endTime}</Text>
            </View>
            <View style={styles.itemCopy}>
              {item.conflicted ? (
                <View style={styles.conflictLabel}>
                  <Ionicons color={colors.red} name="warning" size={13} />
                  <Text style={styles.conflictText}>TIME CONFLICT</Text>
                </View>
              ) : null}
              <Text style={styles.itemTitle}>{item.session.title}</Text>
              <Text numberOfLines={2} style={styles.location}>
                {item.time.location}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Remove from agenda"
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation();
                remove(item.time.id).catch(() => undefined);
              }}
            >
              <Ionicons color={colors.inkMuted} name="close-circle" size={23} />
            </Pressable>
          </Pressable>
        )}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, paddingBottom: spacing.xxl },
  header: { padding: spacing.xl, gap: spacing.sm },
  eyebrow: { color: colors.blueBright, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 31, fontWeight: '900' },
  subtitle: { color: colors.inkMuted, fontSize: 14, marginBottom: spacing.md },
  dayHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  dayTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  itemConflict: { borderColor: colors.red, backgroundColor: colors.redSoft },
  pressed: { opacity: 0.78 },
  timeColumn: { width: 64 },
  startTime: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  endTime: { color: colors.inkMuted, fontSize: 12, marginTop: 3 },
  itemCopy: { flex: 1, gap: 5 },
  itemTitle: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  location: { color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
  conflictLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  conflictText: { color: colors.red, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
});
