import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAgendaActions, useAgendaState } from '../contexts/AgendaContext';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii, spacing, text } from '../theme';
import { Icon } from './Icon';
import { icons } from './icons';

export function AgendaSyncBanner() {
  const { user } = useAuth();
  const { pendingChangeCount, syncError, syncing } = useAgendaState();
  const { retrySync } = useAgendaActions();

  if (!user || (!syncError && pendingChangeCount === 0)) return null;

  const hasError = Boolean(syncError);
  return (
    <View
      accessibilityRole={hasError ? 'alert' : undefined}
      style={[styles.banner, hasError ? styles.errorBanner : styles.syncingBanner]}
    >
      {syncing ? (
        <ActivityIndicator color={colors.tint} size="small" />
      ) : (
        <Icon
          {...(hasError ? icons.cloudOffline : icons.cloudUpload)}
          color={hasError ? colors.orange : colors.tint}
          size={20}
        />
      )}
      <View style={styles.copy}>
        <Text style={text.subheadline}>{hasError ? 'Saved on this device' : 'Syncing your agenda'}</Text>
        <Text selectable style={text.footnoteSecondary}>
          {hasError
            ? syncError
            : `${pendingChangeCount} ${pendingChangeCount === 1 ? 'change' : 'changes'} waiting to sync.`}
        </Text>
      </View>
      {hasError ? (
        <Pressable
          accessibilityRole="button"
          disabled={syncing}
          hitSlop={8}
          onPress={() => void retrySync()}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={[text.subheadline, styles.retry]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
  },
  syncingBanner: { backgroundColor: colors.tintSoft },
  errorBanner: { backgroundColor: colors.orangeSoft },
  copy: { flex: 1, gap: 2 },
  retry: { color: colors.tint, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
