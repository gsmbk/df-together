import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

export function Avatar({
  name,
  color = colors.brandBlue,
  size = 40,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const initials = initialsFor(name);
  return (
    <View
      accessibilityLabel={name}
      style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.text, { fontSize: Math.round(size * 0.4) }]}>{initials || '?'}</Text>
    </View>
  );
}

/** Overlapping row of small avatars with an optional "+N" overflow. */
export function AvatarStack({
  people,
  size = 24,
  max = 4,
}: {
  people: Array<{ id: string; name: string; color: string }>;
  size?: number;
  max?: number;
}) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  return (
    <View style={styles.stack}>
      {shown.map((person, index) => (
        <View
          key={person.id}
          style={[styles.stackItem, { marginLeft: index === 0 ? 0 : -size * 0.3, borderRadius: size / 2 + 1 }]}
        >
          <Avatar color={person.color} name={person.name} size={size} />
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={[
            styles.avatar,
            styles.overflow,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -size * 0.3 },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: Math.round(size * 0.4) }]}>+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontWeight: '600' },
  stack: { flexDirection: 'row', alignItems: 'center' },
  stackItem: { borderWidth: 2, borderColor: colors.card },
  overflow: { backgroundColor: colors.fill, borderWidth: 2, borderColor: colors.card },
  overflowText: { color: colors.secondaryLabel, fontWeight: '600' },
});
