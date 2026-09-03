import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, type } from '../theme';
import { Icon } from './Icon';
import type { IconSpec } from './icons';

type Variant = 'filled' | 'tinted' | 'gray' | 'plain' | 'destructive';

type Props = {
  title: string;
  onPress: () => void;
  icon?: IconSpec;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const labelColors: Record<Variant, typeof colors.tint> = {
  filled: colors.onTint,
  tinted: colors.tint,
  gray: colors.label,
  plain: colors.tint,
  destructive: colors.red,
};

/** iOS 15-style bordered button: filled, tinted, gray, plain, or destructive. */
export function PrimaryButton({
  title,
  onPress,
  icon,
  variant = 'filled',
  disabled,
  loading,
  compact,
  style,
  accessibilityLabel,
}: Props) {
  const color = labelColors[variant];
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        compact && styles.compact,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <>
          {icon ? <Icon {...icon} color={color} size={compact ? 16 : 18} weight="semibold" /> : null}
          <Text style={[compact ? styles.compactLabel : styles.label, { color }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  compact: { minHeight: 34, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  filled: { backgroundColor: colors.tint },
  tinted: { backgroundColor: colors.tintSoft },
  gray: { backgroundColor: colors.tertiaryFill },
  plain: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: colors.redSoft },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
  label: { ...type.body, fontWeight: '600' },
  compactLabel: { ...type.subheadline, fontWeight: '600' },
});
