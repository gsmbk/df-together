import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import {
  createFriendInvite,
  loadSocialSnapshot,
  sendFriendRequest,
  updateFriendship,
} from '../lib/social';
import type { RootStackParamList, TabParamList } from '../navigation';
import { colors, radii, spacing } from '../theme';
import type { FriendProfile, Friendship, SocialSnapshot } from '../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Friends'>,
  NativeStackScreenProps<RootStackParamList>
>;

const emptySnapshot: SocialSnapshot = { friends: [], incoming: [], outgoing: [] };

export function FriendsScreen({ navigation }: Props) {
  const { user, profile, authNotice } = useAuth();
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setSnapshot(await loadSocialSnapshot(user.id));
    } catch (error) {
      Alert.alert('Could not load friends', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.signedOut}>
          <View style={styles.socialIcon}>
            <Ionicons color={colors.white} name="people" size={38} />
          </View>
          <Text style={styles.eyebrow}>PLAN WITH FRIENDS</Text>
          <Text style={styles.title}>Know where your people are.</Text>
          <Text style={styles.body}>
            Connect by mutual approval, keep your agenda private by default, and opt in
            when you’re ready to share.
          </Text>
          <PrimaryButton
            icon="mail-outline"
            onPress={() => navigation.navigate('Auth')}
            title="Sign in with email"
          />
          <View style={styles.benefits}>
            {[
              ['lock-closed-outline', 'Private by default'],
              ['people-outline', 'Mutual friendship approval'],
              ['calendar-outline', 'Side-by-side plans'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.benefit}>
                <Ionicons color={colors.blue} name={icon as never} size={20} />
                <Text style={styles.benefitText}>{label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const inviteByEmail = async () => {
    if (!email.includes('@')) return Alert.alert('Enter your friend’s email address');
    setSending(true);
    try {
      await sendFriendRequest(email);
      setEmail('');
      await refresh();
      Alert.alert('Request sent', 'They’ll need to accept before either agenda is visible.');
    } catch (error) {
      Alert.alert('Could not send request', (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const shareInvite = async () => {
    try {
      const code = await createFriendInvite();
      const link = Linking.createURL(`invite/${code}`, { scheme: 'dftogether' });
      const publicUrl = process.env.EXPO_PUBLIC_APP_SHARE_URL;
      await Share.share({
        message: `Join ${profile?.display_name ?? 'me'} on DF Together to compare Dreamforce 2026 agendas. ${publicUrl ? `${publicUrl}?invite=${code}` : link}`,
      });
    } catch (error) {
      Alert.alert('Could not create invite', (error as Error).message);
    }
  };

  const respond = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await updateFriendship(id, status);
      await refresh();
    } catch (error) {
      Alert.alert('Could not update request', (error as Error).message);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        <Text style={styles.eyebrow}>FRIENDS</Text>
        <Text style={styles.title}>Find your crew</Text>
        <Text style={styles.body}>Only accepted friends can see an agenda you choose to share.</Text>
        {authNotice ? <Text style={styles.notice}>{authNotice}</Text> : null}

        <View style={styles.inviteCard}>
          <Text style={styles.cardTitle}>Invite a friend</Text>
          <View style={styles.emailRow}>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              onSubmitEditing={inviteByEmail}
              placeholder="friend@email.com"
              placeholderTextColor={colors.inkMuted}
              style={styles.emailInput}
              value={email}
            />
            <PrimaryButton compact loading={sending} onPress={inviteByEmail} title="Send" />
          </View>
          <PrimaryButton
            compact
            icon="share-outline"
            onPress={shareInvite}
            title="Share invite link"
            variant="secondary"
          />
        </View>

        {snapshot.incoming.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friend requests</Text>
            {snapshot.incoming.map(({ friendship, profile: friend }) => (
              <View key={friendship.id} style={styles.requestRow}>
                <Avatar color={friend.avatar_color} name={friend.display_name} />
                <Text style={styles.friendName}>{friend.display_name}</Text>
                <Pressable onPress={() => respond(friendship.id, 'rejected')}>
                  <Ionicons color={colors.inkMuted} name="close-circle" size={30} />
                </Pressable>
                <Pressable onPress={() => respond(friendship.id, 'accepted')}>
                  <Ionicons color={colors.green} name="checkmark-circle" size={30} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your friends</Text>
          {loading && !snapshot.friends.length ? (
            <ActivityIndicator color={colors.blueBright} />
          ) : snapshot.friends.length ? (
            snapshot.friends.map(({ friendship, profile: friend }) => (
              <FriendRow
                friend={friend}
                friendship={friendship}
                key={friendship.id}
                onPress={() =>
                  navigation.navigate('FriendAgenda', {
                    friendId: friend.id,
                    friendName: friend.display_name,
                  })
                }
              />
            ))
          ) : (
            <EmptyState
              body="Send an invitation above. Friendship must be mutual before sharing."
              icon="people-outline"
              title="No friends yet"
            />
          )}
        </View>

        {snapshot.outgoing.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Waiting for approval</Text>
            {snapshot.outgoing.map(({ friendship, profile: friend }) => (
              <View key={friendship.id} style={styles.requestRow}>
                <Avatar color={friend.avatar_color} name={friend.display_name} size={38} />
                <Text style={styles.friendName}>{friend.display_name}</Text>
                <Text style={styles.pending}>Pending</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function FriendRow({
  friend,
  onPress,
}: {
  friend: FriendProfile;
  friendship: Friendship;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.friendRow, pressed && styles.pressed]}>
      <Avatar color={friend.avatar_color} name={friend.display_name} />
      <View style={styles.friendCopy}>
        <Text style={styles.friendName}>{friend.display_name}</Text>
        <View style={styles.shareStatus}>
          <Ionicons
            color={friend.share_agenda_with_friends ? colors.green : colors.inkMuted}
            name={friend.share_agenda_with_friends ? 'calendar' : 'lock-closed'}
            size={13}
          />
          <Text style={styles.shareStatusText}>
            {friend.share_agenda_with_friends ? 'Agenda shared' : 'Agenda private'}
          </Text>
        </View>
      </View>
      <Ionicons color={colors.inkMuted} name="chevron-forward" size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  signedOut: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  content: { padding: spacing.xl, paddingBottom: 60, gap: spacing.lg },
  socialIcon: {
    width: 72,
    height: 72,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple,
  },
  eyebrow: { color: colors.blueBright, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 31, lineHeight: 36, fontWeight: '900' },
  body: { color: colors.inkMuted, fontSize: 15, lineHeight: 22 },
  notice: {
    color: colors.green,
    backgroundColor: colors.greenSoft,
    padding: spacing.md,
    borderRadius: radii.sm,
    fontSize: 13,
    fontWeight: '700',
  },
  benefits: { gap: spacing.md, marginTop: spacing.md },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  inviteCard: {
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
  },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emailInput: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    color: colors.ink,
  },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.white,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: { opacity: 0.75 },
  friendCopy: { flex: 1, gap: 4 },
  friendName: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '800' },
  shareStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shareStatusText: { color: colors.inkMuted, fontSize: 12 },
  pending: { color: colors.orange, fontSize: 12, fontWeight: '800' },
});
