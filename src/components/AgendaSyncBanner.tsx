import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAgenda } from '../contexts/AgendaContext';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii, spacing } from '../theme';

export function AgendaSyncBanner() {
  const { user } = useAuth();
  const { pendingChangeCount, retrySync, syncError, syncing } = useAgenda();

  if (!user || (!syncError && pendingChangeCount === 0)) return null;

  const hasError = Boolean(syncError);
  return (
    <View
      accessibilityRole={hasError ? 'alert' : undefined}
      style={[styles.banner, hasError ? styles.errorBanner : styles.syncingBanner]}
    >
      {syncing ? (
        <ActivityIndicator color={colors.blue} size="small" />
      ) : (
        <Ionicons
          color={hasError ? colors.orange : colors.blue}
          name={hasError ? 'cloud-offline-outline' : 'cloud-upload-outline'}
          size={20}
        />
      )}
      <View style={styles.copy}>
        <Text style={styles.title}>
          {hasError ? 'Saved on this device' : 'Syncing your agenda'}
        </Text>
        <Text selectable style={styles.body}>
          {hasError
            ? syncError
            : `${pendingChangeCount} ${pendingChangeCount === 1 ? 'change' : 'changes'} waiting to sync.`}
        </Text>
      </View>
      {hasError ? (
        <Pressable
          accessibilityRole="button"
          disabled={syncing}
          onPress={() => void retrySync()}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  syncingBanner: { backgroundColor: colors.blueSoft },
  errorBanner: { backgroundColor: colors.orangeSoft },
  copy: { flex: 1, gap: 3 },
  title: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  body: { color: colors.inkMuted, fontSize: 11, lineHeight: 16 },
  retry: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  retryText: { color: colors.blue, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
