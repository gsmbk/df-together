import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  authParams,
  inviteCodeFromUrl,
  isAuthCallbackUrl,
} from '../lib/deep-links';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { FriendProfile } from '../types';

const PENDING_INVITE_KEY = 'df-together.pending-invite';

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: FriendProfile | null;
  authNotice: string | null;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuthNotice: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(Boolean(supabase));
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !session?.user) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id,display_name,avatar_color,share_agenda_with_friends')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) throw error;
    setProfile((data as FriendProfile | null) ?? null);
  }, [session?.user]);

  const acceptPendingInvite = useCallback(async () => {
    if (!supabase || !session?.user) return;
    const code = await AsyncStorage.getItem(PENDING_INVITE_KEY);
    if (!code) return;

    const { error } = await supabase.rpc('accept_friend_invite', {
      invite_code: code,
    });
    if (error) {
      setAuthNotice(error.message);
      return;
    }

    await AsyncStorage.removeItem(PENDING_INVITE_KEY);
    setAuthNotice('Friend added. You can now choose whether to share your agenda.');
  }, [session?.user]);

  const handleUrl = useCallback(async (url: string) => {
    if (!supabase) return;
    const inviteCode = inviteCodeFromUrl(url);
    if (inviteCode) {
      await AsyncStorage.setItem(PENDING_INVITE_KEY, inviteCode);
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const { error } = await supabase.rpc('accept_friend_invite', {
          invite_code: inviteCode,
        });
        if (error) {
          setAuthNotice(error.message);
        } else {
          await AsyncStorage.removeItem(PENDING_INVITE_KEY);
          setAuthNotice(
            'Friend added. You can now choose whether to share your agenda.',
          );
        }
      } else {
        setAuthNotice('Sign in to accept this friend invitation.');
      }
    }

    if (!isAuthCallbackUrl(url)) return;
    const { accessToken, refreshToken, code } = authParams(url);

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      setAuthNotice('You’re signed in.');
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      setAuthNotice('You’re signed in.');
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const authSubscription = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url).catch((error) => setAuthNotice(error.message));
    });
    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url).catch((error) => setAuthNotice(error.message));
    });

    return () => {
      authSubscription.data.subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, [handleUrl]);

  useEffect(() => {
    refreshProfile().catch((error) => setAuthNotice(error.message));
    acceptPendingInvite().catch((error) => setAuthNotice(error.message));
  }, [acceptPendingInvite, refreshProfile]);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured yet.');
    const redirectTo = Linking.createURL('auth/callback', { scheme: 'dftogether' });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    if (error) throw error;
    setAuthNotice('Magic link sent. Open it on this device to finish signing in.');
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      authNotice,
      sendMagicLink,
      signOut,
      refreshProfile,
      clearAuthNotice: () => setAuthNotice(null),
    }),
    [authNotice, loading, profile, refreshProfile, sendMagicLink, session, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
