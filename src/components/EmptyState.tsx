import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons color={colors.blueBright} name={icon} size={42} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  body: { color: colors.inkMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
