import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing, text } from '../theme';
import { Icon } from './Icon';
import type { IconSpec } from './icons';

export function EmptyState({
  icon,
  title,
  body,
  style,
  children,
}: {
  icon: IconSpec;
  title: string;
  body: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.wrap, style]}>
      <Icon {...icon} color={colors.tertiaryLabel} size={44} weight="light" />
      <Text style={[text.title3, styles.center]}>{title}</Text>
      <Text style={[text.subheadlineSecondary, styles.center]}>{body}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.xxl, paddingHorizontal: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
});
