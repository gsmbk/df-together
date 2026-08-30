import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  compact,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
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
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.blue}
          size="small"
        />
      ) : (
        <>
          {icon ? (
            <Ionicons
              color={variant === 'primary' ? colors.white : colors.blue}
              name={icon}
              size={compact ? 16 : 19}
            />
          ) : null}
          <Text style={[styles.label, styles[`${variant}Label`]]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  compact: { minHeight: 38, paddingHorizontal: spacing.lg },
  primary: { backgroundColor: colors.blueBright, borderColor: colors.blueBright },
  secondary: { backgroundColor: colors.white, borderColor: colors.blueBright },
  danger: { backgroundColor: colors.white, borderColor: colors.red },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  label: { fontSize: 15, fontWeight: '700' },
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.blue },
  dangerLabel: { color: colors.red },
  ghostLabel: { color: colors.blue },
});
