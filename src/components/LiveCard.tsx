import { Pressable, StyleSheet, Text, View } from 'react-native';
import { timeRange } from '../data/catalog';
import { formatClock, type LiveSnapshot } from '../lib/live';
import { colors, radii, spacing, text } from '../theme';
import type { ResolvedAgendaItem } from '../types';
import { Icon } from './Icon';
import { icons } from './icons';

/** "Happening now" and "Up next" summary shown at the top of the agenda during the event. */
export function LiveCard({
  snapshot,
  onOpen,
}: {
  snapshot: LiveSnapshot;
  onOpen: (item: ResolvedAgendaItem) => void;
}) {
  const { current, next, minutesUntilNext, walkHint } = snapshot;
  if (!current.length && !next) return null;

  return (
    <View style={styles.card}>
      {current.map((item) => (
        <Pressable
          accessibilityRole="button"
          key={item.time.id}
          onPress={() => onOpen(item)}
          style={({ pressed }) => [styles.block, pressed && styles.pressed]}
        >
          <View style={styles.eyebrowRow}>
            <Icon {...icons.now} color={colors.green} size={14} weight="semibold" />
            <Text style={[text.footnote, styles.eyebrowNow]}>Happening now · ends {formatClock(item.time.endAt)}</Text>
          </View>
          <Text numberOfLines={2} style={text.headline}>
            {item.session.title}
          </Text>
          <Text numberOfLines={1} style={text.footnoteSecondary}>
            {item.time.location}
          </Text>
        </Pressable>
      ))}
      {next ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpen(next)}
          style={({ pressed }) => [styles.block, current.length > 0 && styles.blockDivider, pressed && styles.pressed]}
        >
          <View style={styles.eyebrowRow}>
            <Icon {...icons.clock} color={colors.tint} size={14} weight="semibold" />
            <Text style={[text.footnote, styles.eyebrowNext]}>
              {minutesUntilNext <= 0
                ? 'Starting now'
                : minutesUntilNext < 60
                  ? `Up next in ${minutesUntilNext} min`
                  : `Up next at ${formatClock(next.time.startAt)}`}
            </Text>
          </View>
          <Text numberOfLines={2} style={text.headline}>
            {next.session.title}
          </Text>
          <Text numberOfLines={1} style={text.footnoteSecondary}>
            {timeRange(next.time)} · {next.time.location}
          </Text>
          {walkHint ? (
            <View style={styles.walkRow}>
              <Icon {...icons.walk} color={colors.orange} size={14} />
              <Text style={[text.footnote, styles.walk]}>{walkHint}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  block: { padding: spacing.lg, gap: 3 },
  blockDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  pressed: { backgroundColor: colors.quaternaryFill },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  eyebrowNow: { color: colors.green, fontWeight: '600' },
  eyebrowNext: { color: colors.tint, fontWeight: '600' },
  walkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 4 },
  walk: { flex: 1, color: colors.orange },
});
