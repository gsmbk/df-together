import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AgendaSyncBanner } from '../components/AgendaSyncBanner';
import { Avatar } from '../components/Avatar';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { Cell, GroupedSection, Row } from '../components/GroupedList';
import { Icon } from '../components/Icon';
import { icons } from '../components/icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAgendaState } from '../contexts/AgendaContext';
import { useAuth } from '../contexts/AuthContext';
import { catalog } from '../data/catalog';
import { showActions } from '../lib/actions';
import { exportAgendaToCalendar } from '../lib/calendar';
import { ensureNotificationPermission } from '../lib/reminders';
import { updateAgendaSharing, updateDisplayName } from '../lib/social';
import type { ProfileScreenProps } from '../navigation';
import { updatePreferences, usePreferences } from '../state/preferences';
import { colors, spacing, text } from '../theme';

const supportUrl = 'https://df-together.com/support';
const privacyUrl = 'https://df-together.com/privacy';

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, profile, signOut, refreshProfile, configured } = useAuth();
  const { resolved } = useAgendaState();
  const preferences = usePreferences();
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  const setSharing = async (enabled: boolean) => {
    if (!user) return;
    try {
      await updateAgendaSharing(user.id, enabled);
      await refreshProfile();
    } catch (error) {
      Alert.alert('Could not update sharing', (error as Error).message);
    }
  };

  const saveName = async (value: string) => {
    if (!user || value.trim().length < 2) return;
    try {
      await updateDisplayName(user.id, value);
      await refreshProfile();
      setNameDraft(null);
    } catch (error) {
      Alert.alert('Could not save name', (error as Error).message);
    }
  };

  const editName = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Display name',
        'Friends see this name after connecting.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: (value?: string) => void saveName(value ?? '') },
        ],
        'plain-text',
        profile?.display_name ?? '',
      );
    } else {
      setNameDraft(profile?.display_name ?? '');
    }
  };

  const toggleReminders = async (enabled: boolean) => {
    if (enabled && !(await ensureNotificationPermission())) {
      Alert.alert('Notifications are off', 'Allow notifications for DF Together in Settings to get reminders.');
      return;
    }
    updatePreferences({ remindersEnabled: enabled });
  };

  const chooseLeadTime = () =>
    showActions({
      title: 'Remind me before each session',
      options: ([10, 15, 30] as const).map((minutes) => ({
        label: `${minutes} minutes before`,
        onPress: () => updatePreferences({ reminderLeadMinutes: minutes }),
      })),
    });

  const exportAll = () =>
    exportAgendaToCalendar(resolved)
      .then((count) => Alert.alert('Added to Calendar', `${count} ${count === 1 ? 'event' : 'events'} created.`))
      .catch((error) => Alert.alert('Could not add to Calendar', (error as Error).message));

  const interestCount = preferences.interests.products.length + preferences.interests.roles.length;

  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <AgendaSyncBanner />

      {user && profile ? (
        <GroupedSection>
          <Cell style={styles.account}>
            <Avatar color={profile.avatar_color} name={profile.display_name} size={56} />
            <View style={styles.flex}>
              <Text style={text.title3}>{profile.display_name}</Text>
              <Text style={text.footnoteSecondary}>{user.email ?? 'Signed in with Apple'}</Text>
            </View>
          </Cell>
          {nameDraft !== null ? (
            <Cell style={styles.nameEdit}>
              <TextInput
                autoFocus
                maxLength={60}
                onChangeText={setNameDraft}
                onSubmitEditing={() => saveName(nameDraft)}
                placeholder="Your name"
                style={[text.body, styles.flex]}
                value={nameDraft}
              />
              <PrimaryButton compact onPress={() => saveName(nameDraft)} title="Save" />
            </Cell>
          ) : (
            <Row accessory="chevron" detail={profile.display_name} onPress={editName} title="Display name" />
          )}
          <Row
            title="Share my agenda with friends"
            trailing={
              <Switch
                accessibilityLabel="Share my agenda with friends"
                onValueChange={setSharing}
                trackColor={{ true: colors.green as string }}
                value={profile.share_agenda_with_friends}
              />
            }
          />
        </GroupedSection>
      ) : (
        <GroupedSection
          footer={
            configured
              ? `Sign in to sync your ${resolved.length} selected ${resolved.length === 1 ? 'session' : 'sessions'} across devices and connect with friends.`
              : 'Add the Supabase project URL and publishable key to .env to enable accounts.'
          }
        >
          <Row
            leading={<Icon {...icons.person} color={colors.tint} size={22} />}
            onPress={() => navigation.navigate('Auth')}
            tinted
            title="Sign in"
          />
        </GroupedSection>
      )}

      <GroupedSection
        footer="Reminders are local notifications for sessions on your agenda. Nothing leaves your device."
        header="Planning"
      >
        <Row
          accessory="chevron"
          detail={interestCount ? `${interestCount} selected` : 'None'}
          leading={<Icon {...icons.sparkles} color={colors.purple} size={20} />}
          onPress={() => navigation.navigate('Interests')}
          title="Interests"
        />
        <Row
          leading={<Icon {...icons.bell} color={colors.red} size={20} />}
          title="Session reminders"
          trailing={
            <Switch
              accessibilityLabel="Session reminders"
              onValueChange={toggleReminders}
              trackColor={{ true: colors.green as string }}
              value={preferences.remindersEnabled}
            />
          }
        />
        {preferences.remindersEnabled ? (
          <Row accessory="chevron" detail={`${preferences.reminderLeadMinutes} min before`} onPress={chooseLeadTime} title="Remind me" />
        ) : null}
        <Row
          disabled={!resolved.length}
          leading={<Icon {...icons.calendarAdd} color={colors.tint} size={20} />}
          onPress={exportAll}
          subtitle={resolved.length ? `${resolved.length} ${resolved.length === 1 ? 'session' : 'sessions'} with 15-minute alerts` : 'Add sessions to your agenda first'}
          tinted
          title="Add agenda to Calendar"
        />
      </GroupedSection>

      <GroupedSection header="About">
        <Row detail={catalog.metadata.sessionCount.toLocaleString()} title="Sessions in catalog" />
        <Row detail={new Date(catalog.metadata.importedAt).toLocaleDateString()} title="Catalog updated" />
        <Row accessory="chevron" onPress={() => Linking.openURL(catalog.metadata.sourceUrl)} title="Official Dreamforce catalog" />
        <Row accessory="chevron" onPress={() => Linking.openURL(privacyUrl)} title="Privacy" />
        <Row accessory="chevron" onPress={() => Linking.openURL(supportUrl)} title="Support" />
      </GroupedSection>

      {user ? (
        <GroupedSection>
          <Row
            destructive
            onPress={() =>
              signOut().catch((error) => Alert.alert('Could not sign out', (error as Error).message))
            }
            title="Sign out"
          />
        </GroupedSection>
      ) : null}

      <DisclaimerFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.xl },
  flex: { flex: 1 },
  account: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg },
  nameEdit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
