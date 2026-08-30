import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { useAgenda } from '../contexts/AgendaContext';
import { timeIndex } from '../data/catalog';
import { loadFriendAgenda } from '../lib/social';
import type { RootStackParamList } from '../navigation';
import { colors, radii, spacing } from '../theme';
import type { AgendaSelection } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendAgenda'>;

export function FriendAgendaScreen({ route }: Props) {
  const { selectedTimeIds } = useAgenda();
  const [items, setItems] = useState<AgendaSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriendAgenda(route.params.friendId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [route.params.friendId]);

  const resolved = useMemo(
    () =>
      items
        .map((item) => timeIndex.get(item.sessionTimeId))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((a, b) => a.time.startAt.localeCompare(b.time.startAt)),
    [items],
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.friendHeader}>
          <Avatar name={route.params.friendName} size={60} />
          <View>
            <Text style={styles.eyebrow}>SHARED AGENDA</Text>
            <Text style={styles.title}>{route.params.friendName}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.blueBright} size="large" />
        ) : resolved.length ? (
          resolved.map(({ session, time }) => {
            const together = selectedTimeIds.has(time.id);
            return (
              <View key={time.id} style={[styles.item, together && styles.together]}>
                <View style={styles.timeColumn}>
                  <Text style={styles.day}>{time.dateLabel.replace(', Sep ', ' ')}</Text>
                  <Text style={styles.time}>{time.startTime}</Text>
                </View>
                <View style={styles.copy}>
                  {together ? <Text style={styles.togetherLabel}>YOU’RE BOTH GOING</Text> : null}
                  <Text style={styles.itemTitle}>{session.title}</Text>
                  <Text style={styles.location}>{time.location}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState
            body="Their agenda is either empty or still private. They control sharing from Profile."
            icon="lock-closed-outline"
            title="Nothing shared yet"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, padding: spacing.xl, paddingBottom: 60, gap: spacing.lg },
  friendHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  eyebrow: { color: colors.blueBright, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 27, fontWeight: '900', marginTop: 3 },
  item: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  together: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  timeColumn: { width: 72, gap: 3 },
  day: { color: colors.inkMuted, fontSize: 11, fontWeight: '700' },
  time: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  copy: { flex: 1, gap: 4 },
  togetherLabel: { color: colors.green, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  itemTitle: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  location: { color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
});
