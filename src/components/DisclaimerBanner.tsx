import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { catalog } from '../data/catalog';
import { colors, radii, spacing } from '../theme';

export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.banner, compact && styles.compact]}>
      <Ionicons color={colors.orange} name="information-circle" size={20} />
      <View style={styles.copy}>
        {!compact ? <Text style={styles.title}>Independent planning tool</Text> : null}
        <Text style={styles.body}>{catalog.metadata.disclaimer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radii.md,
    padding: spacing.lg,
    backgroundColor: colors.orangeSoft,
  },
  compact: { paddingVertical: spacing.md },
  copy: { flex: 1, gap: 2 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  body: { color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
});
