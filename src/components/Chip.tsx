import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'blue' | 'purple' | 'green' | 'orange';
};

export function Chip({ label, selected, onPress, tone = 'blue' }: Props) {
  const content = (
    <Text style={[styles.label, styles[`${tone}Label`], selected && styles.selectedLabel]}>
      {label}
    </Text>
  );

  if (!onPress) {
    return <Text style={[styles.base, styles[tone]]}>{content}</Text>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[tone],
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  blue: { backgroundColor: colors.blueSoft },
  purple: { backgroundColor: colors.purpleSoft },
  green: { backgroundColor: colors.greenSoft },
  orange: { backgroundColor: colors.orangeSoft },
  selected: { backgroundColor: colors.navy },
  pressed: { opacity: 0.72 },
  label: { fontSize: 12, fontWeight: '700' },
  blueLabel: { color: colors.blue },
  purpleLabel: { color: colors.purple },
  greenLabel: { color: colors.green },
  orangeLabel: { color: colors.orange },
  selectedLabel: { color: colors.white },
});
