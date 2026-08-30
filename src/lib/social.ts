import { supabase } from './supabase';
import type {
  AgendaSelection,
  FriendProfile,
  Friendship,
  SocialSnapshot,
} from '../types';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured yet.');
  return supabase;
}

export async function loadSocialSnapshot(userId: string): Promise<SocialSnapshot> {
  const client = requireSupabase();
  const { data: relationshipRows, error } = await client
    .from('friendships')
    .select('id,requester_id,addressee_id,status,created_at')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const relationships = (relationshipRows ?? []) as Friendship[];
  const profileIds = relationships.map((relationship) =>
    relationship.requester_id === userId
      ? relationship.addressee_id
      : relationship.requester_id,
  );
  const { data: profileRows, error: profileError } = profileIds.length
    ? await client
        .from('profiles')
        .select('id,display_name,avatar_color,share_agenda_with_friends')
        .in('id', profileIds)
    : { data: [], error: null };
  if (profileError) throw profileError;

  const profileMap = new Map(
    ((profileRows ?? []) as FriendProfile[]).map((profile) => [profile.id, profile]),
  );
  const withProfiles = relationships.flatMap((friendship) => {
    const friendId =
      friendship.requester_id === userId
        ? friendship.addressee_id
        : friendship.requester_id;
    const profile = profileMap.get(friendId);
    return profile ? [{ friendship, profile }] : [];
  });

  return {
    friends: withProfiles.filter(({ friendship }) => friendship.status === 'accepted'),
    incoming: withProfiles.filter(
      ({ friendship }) =>
        friendship.status === 'pending' && friendship.addressee_id === userId,
    ),
    outgoing: withProfiles.filter(
      ({ friendship }) =>
        friendship.status === 'pending' && friendship.requester_id === userId,
    ),
  };
}

export async function sendFriendRequest(email: string) {
  const { data, error } = await requireSupabase().rpc('send_friend_request', {
    friend_email: email.trim().toLowerCase(),
  });
  if (error) throw error;
  return data;
}

export async function createFriendInvite() {
  const { data, error } = await requireSupabase().rpc('create_friend_invite');
  if (error) throw error;
  return data as string;
}

export async function updateFriendship(
  friendshipId: string,
  status: 'accepted' | 'rejected',
) {
  const { error } = await requireSupabase()
    .from('friendships')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', friendshipId);
  if (error) throw error;
}

export async function removeFriendship(friendshipId: string) {
  const { error } = await requireSupabase()
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  if (error) throw error;
}

export async function updateAgendaSharing(userId: string, enabled: boolean) {
  const { error } = await requireSupabase()
    .from('profiles')
    .update({ share_agenda_with_friends: enabled })
    .eq('id', userId);
  if (error) throw error;
}

export async function updateDisplayName(userId: string, displayName: string) {
  const { error } = await requireSupabase()
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', userId);
  if (error) throw error;
}

export async function loadFriendAgenda(friendId: string) {
  const { data, error } = await requireSupabase()
    .from('agenda_items')
    .select('session_id,session_time_id')
    .eq('user_id', friendId);
  if (error) throw error;
  return (data ?? []).map(
    (row): AgendaSelection => ({
      sessionId: row.session_id as string,
      sessionTimeId: row.session_time_id as string,
    }),
  );
}
