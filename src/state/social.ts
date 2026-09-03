import { useMemo } from 'react';
import { loadFriendAgendas, loadSocialSnapshot } from '../lib/social';
import { createStore } from './store';
import type { AgendaSelection, FriendProfile, SocialSnapshot } from '../types';

export const emptySnapshot: SocialSnapshot = { friends: [], incoming: [], outgoing: [] };

type SocialState = {
  snapshot: SocialSnapshot;
  /** Selections per friend id, only for friends who share. */
  agendas: Record<string, AgendaSelection[]>;
  loadedForUser: string | null;
  loading: boolean;
  error: string | null;
};

export const socialStore = createStore<SocialState>({
  snapshot: emptySnapshot,
  agendas: {},
  loadedForUser: null,
  loading: false,
  error: null,
});

export const useSocial = socialStore.use;

let inflight: Promise<void> | null = null;

/** Refresh friends and their shared agendas. Concurrent calls share one request. */
export function refreshSocial(userId: string) {
  if (inflight) return inflight;
  socialStore.set((current) => ({ ...current, loading: true, error: null }));
  inflight = (async () => {
    try {
      const snapshot = await loadSocialSnapshot(userId);
      const sharingIds = snapshot.friends
        .filter(({ profile }) => profile.share_agenda_with_friends)
        .map(({ profile }) => profile.id);
      const agendas = await loadFriendAgendas(sharingIds);
      socialStore.set({ snapshot, agendas, loadedForUser: userId, loading: false, error: null });
    } catch (error) {
      socialStore.set((current) => ({
        ...current,
        loading: false,
        error: (error as Error).message,
      }));
      throw error;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function clearSocial() {
  socialStore.set({ snapshot: emptySnapshot, agendas: {}, loadedForUser: null, loading: false, error: null });
}

export type FriendHint = { id: string; name: string; color: string; sessionTimeId: string };

/** Friends attending a session, keyed by occurrence, and by session overall. */
export function useFriendsGoing() {
  const { snapshot, agendas } = useSocial();
  return useMemo(() => {
    const profiles = new Map<string, FriendProfile>(
      snapshot.friends.map(({ profile }) => [profile.id, profile]),
    );
    const byTime = new Map<string, FriendHint[]>();
    const bySession = new Map<string, FriendHint[]>();
    for (const [friendId, selections] of Object.entries(agendas)) {
      const profile = profiles.get(friendId);
      if (!profile) continue;
      for (const selection of selections) {
        const hint: FriendHint = {
          id: profile.id,
          name: profile.display_name,
          color: profile.avatar_color,
          sessionTimeId: selection.sessionTimeId,
        };
        (byTime.get(selection.sessionTimeId) ?? byTime.set(selection.sessionTimeId, []).get(selection.sessionTimeId))!.push(hint);
        const forSession = bySession.get(selection.sessionId) ?? [];
        if (!forSession.some((existing) => existing.id === hint.id)) forSession.push(hint);
        bySession.set(selection.sessionId, forSession);
      }
    }
    return { byTime, bySession, friendCount: snapshot.friends.length };
  }, [agendas, snapshot.friends]);
}
