import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { earliestTime, shortDay, timeRange } from '../data/catalog';
import { colors, hairline, radii, spacing, text } from '../theme';
import type { DreamforceSession } from '../types';
import { Avatar } from './Avatar';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { icons } from './icons';

export type RowPosition = 'single' | 'first' | 'middle' | 'last';

export type FriendHintLite = { id: string; name: string; color: string };

type Props = {
  session: DreamforceSession;
  selected: boolean;
  position: RowPosition;
  onOpen: (session: DreamforceSession) => void;
  onToggle: (session: DreamforceSession) => void;
  /** Friends attending this session, for the small avatar hint. */
  friends?: FriendHintLite[];
};

/**
 * A session inside an inset-grouped list. Rows are memoized on their props and
 * receive stable callbacks, so an agenda change only re-renders the rows whose
 * `selected` flag actually changed.
 */
export const SessionRow = memo(function SessionRow({
  session,
  selected,
  position,
  onOpen,
  onToggle,
  friends,
}: Props) {
  const time = earliestTime(session);
  const extraTimes = session.times.length - 1;
  const format = session.formats[0];
  const level = session.levels[0];

  return (
    <View style={[styles.wrap, positionStyles[position]]}>
      <Pressable
        accessibilityHint="Opens session details"
        accessibilityRole="button"
        onPress={() => onOpen(session)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.copy}>
          <Text numberOfLines={2} style={text.headline}>
            {session.title}
          </Text>
          <Text numberOfLines={1} style={text.subheadlineSecondary}>
            {shortDay(time.dateLabel)} · {timeRange(time)}
            {extraTimes > 0 ? `  ·  +${extraTimes} more ${extraTimes === 1 ? 'time' : 'times'}` : ''}
          </Text>
          <Text numberOfLines={1} style={text.footnoteSecondary}>
            {time.location}
          </Text>
          {format || level || friends?.length ? (
            <View style={styles.tags}>
              {format ? <Chip label={format} /> : null}
              {level ? <Chip label={level} tone="purple" /> : null}
              {friends?.length ? (
                <View style={styles.friends}>
                  {friends.slice(0, 3).map((friend) => (
                    <Avatar color={friend.color} key={friend.id} name={friend.name} size={18} />
                  ))}
                  <Text style={text.caption1Secondary}>
                    {friends.length === 1 ? friends[0].name.split(' ')[0] : `${friends.length} friends`}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel={selected ? 'Remove from agenda' : 'Add to agenda'}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          hitSlop={10}
          onPress={() => onToggle(session)}
          style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
        >
          <Icon
            {...(selected ? icons.added : icons.add)}
            color={selected ? colors.green : colors.tint}
            size={28}
          />
        </Pressable>
      </Pressable>
      {position === 'first' || position === 'middle' ? <View style={styles.separator} /> : null}
    </View>
  );
});

const positionStyles = StyleSheet.create({
  single: { borderRadius: radii.lg },
  first: { borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg },
  middle: {},
  last: { borderBottomLeftRadius: radii.lg, borderBottomRightRadius: radii.lg },
});

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: { backgroundColor: colors.quaternaryFill },
  copy: { flex: 1, gap: 3 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 },
  friends: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 2 },
  toggle: { padding: 2, marginTop: -2 },
  togglePressed: { opacity: 0.5 },
  separator: { height: hairline, backgroundColor: colors.separator, marginLeft: spacing.lg },
});
