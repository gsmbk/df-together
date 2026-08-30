import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAgenda } from '../contexts/AgendaContext';
import { useAuth } from '../contexts/AuthContext';
import { catalog } from '../data/catalog';
import { updateAgendaSharing, updateDisplayName } from '../lib/social';
import type { RootStackParamList, TabParamList } from '../navigation';
import { colors, radii, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { user, profile, signOut, refreshProfile, configured } = useAuth();
  const { selections } = useAgenda();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [sharing, setSharing] = useState(profile?.share_agenda_with_friends ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setSharing(profile?.share_agenda_with_friends ?? false);
  }, [profile]);

  const updateSharing = async (enabled: boolean) => {
    if (!user) return;
    setSharing(enabled);
    try {
      await updateAgendaSharing(user.id, enabled);
      await refreshProfile();
    } catch (error) {
      setSharing(!enabled);
      Alert.alert('Could not update sharing', (error as Error).message);
    }
  };

  const saveName = async () => {
    if (!user || displayName.trim().length < 2) return;
    setSaving(true);
    try {
      await updateDisplayName(user.id, displayName);
      await refreshProfile();
    } catch (error) {
      Alert.alert('Could not save profile', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>PROFILE & PRIVACY</Text>
        <Text style={styles.title}>You’re in control</Text>

        {user && profile ? (
          <>
            <View style={styles.profileCard}>
              <Avatar color={profile.avatar_color} name={profile.display_name} size={64} />
              <View style={styles.profileCopy}>
                <Text style={styles.profileName}>{profile.display_name}</Text>
                <Text style={styles.email}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Display name</Text>
              <Text style={styles.cardBody}>Friends see this name after connecting.</Text>
              <TextInput
                maxLength={60}
                onChangeText={setDisplayName}
                placeholder="Your name"
                style={styles.input}
                value={displayName}
              />
              <PrimaryButton
                compact
                disabled={displayName.trim() === profile.display_name}
                loading={saving}
                onPress={saveName}
                title="Save name"
              />
            </View>

            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <View style={styles.switchTitleRow}>
                    <Ionicons color={colors.blue} name="calendar-outline" size={20} />
                    <Text style={styles.cardTitle}>Share my agenda</Text>
                  </View>
                  <Text style={styles.cardBody}>
                    Off by default. When on, only accepted friends can view your selected
                    sessions.
                  </Text>
                </View>
                <Switch
                  onValueChange={updateSharing}
                  trackColor={{ false: colors.lineStrong, true: colors.green }}
                  value={sharing}
                />
              </View>
            </View>

            <PrimaryButton
              onPress={() => signOut().catch((error) => Alert.alert(error.message))}
              title="Sign out"
              variant="danger"
            />
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {configured ? 'Sign in to sync and share' : 'Connect Supabase to enable social'}
            </Text>
            <Text style={styles.cardBody}>
              Your {selections.length} locally selected sessions stay on this device until
              you sign in.
            </Text>
            <PrimaryButton
              icon="mail-outline"
              onPress={() => navigation.navigate('Auth')}
              title="Sign in with email"
            />
          </View>
        )}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{selections.length}</Text>
            <Text style={styles.statLabel}>My sessions</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{catalog.metadata.sessionCount}</Text>
            <Text style={styles.statLabel}>Catalog sessions</Text>
          </View>
        </View>

        <DisclaimerBanner />
        <Text style={styles.imported}>
          Catalog imported {new Date(catalog.metadata.importedAt).toLocaleDateString()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.xl, paddingBottom: 60, gap: spacing.lg },
  eyebrow: { color: colors.blueBright, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 31, fontWeight: '900' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  profileCopy: { flex: 1, gap: 4 },
  profileName: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  email: { color: colors.inkMuted, fontSize: 13 },
  card: {
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  cardBody: { color: colors.inkMuted, fontSize: 13, lineHeight: 19 },
  input: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    color: colors.ink,
    fontSize: 15,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  switchCopy: { flex: 1, gap: spacing.sm },
  switchTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.blueSoft,
  },
  statValue: { color: colors.blue, fontSize: 26, fontWeight: '900' },
  statLabel: { color: colors.inkMuted, fontSize: 12, marginTop: 3 },
  imported: { color: colors.inkMuted, fontSize: 11, textAlign: 'center' },
});
