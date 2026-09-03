import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '../theme';
import { Icon } from './Icon';
import type { IconSpec } from './icons';

/** Navigation bar button: an SF Symbol, a text label, or both. */
export function HeaderButton({
  icon,
  label,
  onPress,
  accessibilityLabel,
  bold,
  badge,
  disabled,
}: {
  icon?: IconSpec;
  label?: string;
  onPress: () => void;
  accessibilityLabel?: string;
  bold?: boolean;
  badge?: number;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {icon ? <Icon {...icon} color={colors.tint} size={22} weight="regular" /> : null}
      {label ? <Text style={[styles.label, bold && styles.bold]}>{label}</Text> : null}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2, minHeight: 32 },
  pressed: { opacity: 0.4 },
  disabled: { opacity: 0.35 },
  label: { ...type.body, color: colors.tint },
  bold: { fontWeight: '600' },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  badgeText: { ...type.caption2, fontWeight: '700', color: colors.onTint },
});
