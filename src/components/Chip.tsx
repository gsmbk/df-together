import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../theme';

type Tone = 'tint' | 'purple' | 'green' | 'orange' | 'neutral';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: Tone;
};

/** Small capsule tag. Selected chips fill with the tint, like iOS filter pills. */
export function Chip({ label, selected, onPress, tone = 'tint' }: Props) {
  const content = (
    <Text style={[styles.label, styles[`${tone}Label`], selected && styles.selectedLabel]}>
      {label}
    </Text>
  );

  if (!onPress) {
    return <View style={[styles.base, styles[tone]]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles.pressable,
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
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    alignSelf: 'flex-start',
  },
  pressable: { minHeight: 32, paddingVertical: 7, paddingHorizontal: spacing.md, justifyContent: 'center' },
  tint: { backgroundColor: colors.tintSoft },
  purple: { backgroundColor: colors.purpleSoft },
  green: { backgroundColor: colors.greenSoft },
  orange: { backgroundColor: colors.orangeSoft },
  neutral: { backgroundColor: colors.tertiaryFill },
  selected: { backgroundColor: colors.tint },
  pressed: { opacity: 0.7 },
  label: { ...type.caption1, fontWeight: '600' },
  tintLabel: { color: colors.tint },
  purpleLabel: { color: colors.purple },
  greenLabel: { color: colors.green },
  orangeLabel: { color: colors.orange },
  neutralLabel: { color: colors.secondaryLabel },
  selectedLabel: { color: colors.onTint },
});
