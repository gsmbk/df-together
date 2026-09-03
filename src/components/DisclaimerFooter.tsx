import { StyleSheet, Text, View } from 'react-native';
import { catalog } from '../data/catalog';
import { colors, spacing, text } from '../theme';
import { Icon } from './Icon';
import { icons } from './icons';

/** Planning-only notice rendered as a quiet grouped-list footnote. */
export function DisclaimerFooter() {
  return (
    <View style={styles.wrap}>
      <Icon {...icons.info} color={colors.tertiaryLabel} size={14} />
      <Text style={[text.footnoteSecondary, styles.copy]}>
        {catalog.metadata.disclaimer} DF Together is not affiliated with Salesforce.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  copy: { flex: 1 },
});
