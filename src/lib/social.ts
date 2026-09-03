import { supabase } from './supabase';
import type { AgendaSelection, FriendProfile, Friendship, SocialSnapshot } from '../types';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured yet.');
  return supabase;
}

const profileColumns = 'id,display_name,avatar_color,share_agenda_with_friends';

type FriendshipRow = Friendship & {
  requester: FriendProfile | FriendProfile[] | null;
  addressee: FriendProfile | FriendProfile[] | null;
};

function single<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * One round trip: friendships with both profiles embedded through the foreign
 * keys. Row-level security hides profiles we have no active relationship with,
 * so rejected relationships simply come back without a profile and are skipped.
 */
export async function loadSocialSnapshot(userId: string): Promise<SocialSnapshot> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('friendships')
    .select(
      `id,requester_id,addressee_id,status,created_at,` +
        `requester:profiles!friendships_requester_id_fkey(${profileColumns}),` +
        `addressee:profiles!friendships_addressee_id_fkey(${profileColumns})`,
    )
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const withProfiles = ((data ?? []) as unknown as FriendshipRow[]).flatMap((row) => {
    const { requester, addressee, ...friendship } = row;
    const profile = single(friendship.requester_id === userId ? addressee : requester);
    return profile ? [{ friendship: friendship as Friendship, profile }] : [];
  });

  return {
    friends: withProfiles.filter(({ friendship }) => friendship.status === 'accepted'),
    incoming: withProfiles.filter(
      ({ friendship }) => friendship.status === 'pending' && friendship.addressee_id === userId,
    ),
    outgoing: withProfiles.filter(
      ({ friendship }) => friendship.status === 'pending' && friendship.requester_id === userId,
    ),
  };
}

export async function sendFriendRequest(email: string) {
  const { data, error } = await requireSupabase().rpc('send_friend_request', {
    friend_email: email.trim().toLowerCase(),
  });
  if (error) throw error;
  return data as string | null;
}

export async function createFriendInvite() {
  const { data, error } = await requireSupabase().rpc('create_friend_invite');
  if (error) throw error;
  return data as string;
}

export async function updateFriendship(friendshipId: string, status: 'accepted' | 'rejected') {
  const { error } = await requireSupabase()
    .from('friendships')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', friendshipId);
  if (error) throw error;
}

export async function removeFriendship(friendshipId: string) {
  const { error } = await requireSupabase().from('friendships').delete().eq('id', friendshipId);
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

function toSelections(rows: Array<{ session_id: unknown; session_time_id: unknown; user_id?: unknown }>) {
  return rows.map(
    (row): AgendaSelection & { userId: string } => ({
      userId: String(row.user_id ?? ''),
      sessionId: row.session_id as string,
      sessionTimeId: row.session_time_id as string,
    }),
  );
}

export async function loadFriendAgenda(friendId: string): Promise<AgendaSelection[]> {
  const { data, error } = await requireSupabase()
    .from('agenda_items')
    .select('session_id,session_time_id')
    .eq('user_id', friendId);
  if (error) throw error;
  return toSelections(data ?? []).map(({ sessionId, sessionTimeId }) => ({ sessionId, sessionTimeId }));
}

/** Agendas of every friend who shares, grouped by friend, in one query. */
export async function loadFriendAgendas(friendIds: string[]) {
  const byFriend: Record<string, AgendaSelection[]> = {};
  if (!friendIds.length) return byFriend;
  const { data, error } = await requireSupabase()
    .from('agenda_items')
    .select('user_id,session_id,session_time_id')
    .in('user_id', friendIds);
  if (error) throw error;
  for (const row of toSelections(data ?? [])) {
    (byFriend[row.userId] ??= []).push({ sessionId: row.sessionId, sessionTimeId: row.sessionTimeId });
  }
  return byFriend;
}
