import { useFocusEffect } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Avatar } from '../components/Avatar';
import { BrandMark } from '../components/BrandMark';
import { EmptyState } from '../components/EmptyState';
import { Cell, GroupedSection, Row } from '../components/GroupedList';
import { Icon } from '../components/Icon';
import { icons } from '../components/icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAgendaState } from '../contexts/AgendaContext';
import { useAuth } from '../contexts/AuthContext';
import { confirmDestructive, showActions } from '../lib/actions';
import { createFriendInvite, removeFriendship, sendFriendRequest, updateFriendship } from '../lib/social';
import type { FriendsScreenProps } from '../navigation';
import { refreshSocial, useSocial } from '../state/social';
import { colors, radii, spacing, text } from '../theme';
import type { FriendProfile, Friendship } from '../types';

export function FriendsScreen({ navigation }: FriendsScreenProps) {
  const { user, profile, authNotice, clearAuthNotice } = useAuth();
  const { snapshot, agendas, loading } = useSocial();
  const { selectedTimeIds } = useAgendaState();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const refresh = useCallback(() => {
    if (!user) return;
    refreshSocial(user.id).catch((error) => Alert.alert('Could not load friends', (error as Error).message));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.signedOut} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.hero}>
          <BrandMark size={72} />
          <Text style={[text.title1, styles.center]}>Know where your people are</Text>
          <Text style={[text.bodySecondary, styles.center]}>
            Connect by mutual approval, keep your agenda private by default, and share it only when you choose.
          </Text>
        </View>
        <GroupedSection>
          <Row leading={<Icon {...icons.lock} color={colors.tint} size={20} />} title="Private by default" />
          <Row leading={<Icon {...icons.people} color={colors.tint} size={20} />} title="Friendships need mutual approval" />
          <Row leading={<Icon {...icons.calendar} color={colors.tint} size={20} />} title="See who is going where, side by side" />
        </GroupedSection>
        <PrimaryButton icon={icons.person} onPress={() => navigation.navigate('Auth')} title="Sign in" />
      </ScrollView>
    );
  }

  const inviteByEmail = async () => {
    if (!email.includes('@')) return Alert.alert('Enter your friend’s email address');
    setSending(true);
    try {
      await sendFriendRequest(email);
      setEmail('');
      refresh();
      Alert.alert(
        'Request sent',
        'If that email has a DF Together account, they will see your request. Otherwise share an invite link.',
      );
    } catch (error) {
      Alert.alert('Could not send request', (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const shareInvite = async () => {
    try {
      const code = await createFriendInvite();
      const fallback = Linking.createURL(`invite/${code}`, { scheme: 'dftogether' });
      const publicUrl = process.env.EXPO_PUBLIC_APP_SHARE_URL;
      const link = publicUrl ? `${publicUrl}?invite=${code}` : fallback;
      await Share.share({
        message: `Join ${profile?.display_name ?? 'me'} on DF Together to compare Dreamforce 2026 agendas. ${link}`,
        url: link,
      });
    } catch (error) {
      Alert.alert('Could not create invite', (error as Error).message);
    }
  };

  const respond = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await updateFriendship(id, status);
      refresh();
    } catch (error) {
      Alert.alert('Could not update request', (error as Error).message);
    }
  };

  const friendOptions = (friendship: Friendship, friend: FriendProfile) =>
    showActions({
      title: friend.display_name,
      options: [
        {
          label: 'View agenda',
          onPress: () => navigation.navigate('FriendAgenda', { friendId: friend.id, friendName: friend.display_name }),
        },
        {
          label: 'Remove friend',
          destructive: true,
          onPress: () =>
            confirmDestructive({
              title: `Remove ${friend.display_name}?`,
              message: 'Neither of you will see the other’s agenda. You can reconnect later.',
              confirmLabel: 'Remove',
              onConfirm: () =>
                removeFriendship(friendship.id)
                  .then(refresh)
                  .catch((error) => Alert.alert('Could not remove friend', (error as Error).message)),
            }),
        },
      ],
    });

  const inCommon = (friendId: string) =>
    (agendas[friendId] ?? []).reduce(
      (total, selection) => total + (selectedTimeIds.has(selection.sessionTimeId) ? 1 : 0),
      0,
    );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl onRefresh={refresh} refreshing={loading && snapshot.friends.length > 0} />}
    >
      {authNotice ? (
        <Pressable accessibilityHint="Dismisses this message" accessibilityRole="button" onPress={clearAuthNotice} style={styles.notice}>
          <Icon {...icons.infoFill} color={colors.tint} size={18} />
          <Text style={[text.footnote, styles.flex]}>{authNotice}</Text>
          <Icon {...icons.close} color={colors.tertiaryLabel} size={14} weight="semibold" />
        </Pressable>
      ) : null}

      <GroupedSection footer="Only accepted friends can see an agenda you choose to share." header="Invite">
        <Cell style={styles.emailCell}>
          <Icon {...icons.mail} color={colors.secondaryLabel} size={18} />
          <TextInput
            accessibilityLabel="Friend’s email address"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={inviteByEmail}
            placeholder="friend@company.com"
            placeholderTextColor={colors.placeholder}
            returnKeyType="send"
            style={[text.body, styles.flex]}
            textContentType="emailAddress"
            value={email}
          />
          <PrimaryButton compact disabled={!email.includes('@')} loading={sending} onPress={inviteByEmail} title="Send" />
        </Cell>
        <Row
          leading={<Icon {...icons.share} color={colors.tint} size={20} />}
          onPress={shareInvite}
          tinted
          title="Share an invite link"
        />
      </GroupedSection>

      {snapshot.incoming.length ? (
        <GroupedSection header="Requests">
          {snapshot.incoming.map(({ friendship, profile: friend }) => (
            <Row
              key={friendship.id}
              leading={<Avatar color={friend.avatar_color} name={friend.display_name} size={32} />}
              title={friend.display_name}
              trailing={
                <View style={styles.requestActions}>
                  <PrimaryButton compact onPress={() => respond(friendship.id, 'rejected')} title="Decline" variant="gray" />
                  <PrimaryButton compact onPress={() => respond(friendship.id, 'accepted')} title="Accept" />
                </View>
              }
            />
          ))}
        </GroupedSection>
      ) : null}

      <GroupedSection header="Friends">
        {snapshot.friends.length ? (
          snapshot.friends.map(({ friendship, profile: friend }) => {
            const common = friend.share_agenda_with_friends ? inCommon(friend.id) : 0;
            return (
              <Row
                accessibilityHint="Opens their shared agenda. Long press for more options."
                accessory="chevron"
                key={friendship.id}
                leading={<Avatar color={friend.avatar_color} name={friend.display_name} size={36} />}
                onPress={() =>
                  navigation.navigate('FriendAgenda', { friendId: friend.id, friendName: friend.display_name })
                }
                subtitle={
                  friend.share_agenda_with_friends
                    ? common
                      ? `Sharing · ${common} ${common === 1 ? 'session' : 'sessions'} together`
                      : 'Sharing their agenda'
                    : 'Agenda private'
                }
                title={friend.display_name}
                trailing={
                  <Pressable
                    accessibilityLabel={`More options for ${friend.display_name}`}
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => friendOptions(friendship, friend)}
                  >
                    <Icon {...icons.personRemove} color={colors.tertiaryLabel} size={18} />
                  </Pressable>
                }
              />
            );
          })
        ) : (
          <EmptyState
            body={loading ? 'Loading your friends…' : 'Send an invitation above. Friendships are mutual before anything is shared.'}
            icon={icons.people}
            style={styles.emptyInCard}
            title="No friends yet"
          />
        )}
      </GroupedSection>

      {snapshot.outgoing.length ? (
        <GroupedSection header="Waiting for approval">
          {snapshot.outgoing.map(({ friendship, profile: friend }) => (
            <Row
              detail="Pending"
              key={friendship.id}
              leading={<Avatar color={friend.avatar_color} name={friend.display_name} size={32} />}
              title={friend.display_name}
            />
          ))}
        </GroupedSection>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.xl },
  signedOut: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  center: { textAlign: 'center' },
  flex: { flex: 1 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    backgroundColor: colors.tintSoft,
  },
  emailCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  emptyInCard: { paddingVertical: spacing.xl },
});
