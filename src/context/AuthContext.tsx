import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isBanned: boolean;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function checkBanned(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.banned_by === null) return false;
  if (profile.ban_until === null) return true; // permanent ban
  return new Date(profile.ban_until) > new Date();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Load or create profile when session changes
  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const userId = session.user.id;
      const { data: existing, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Profile load error:', error.message);
        setLoading(false);
        return;
      }

      if (existing) {
        setProfile(existing as Profile);
        setLoading(false);
      } else {
        const username =
          session.user.user_metadata?.username as string | undefined;
        if (!username) {
          setLoading(false);
          return;
        }
        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .insert({ user_id: userId, username })
          .select('*')
          .maybeSingle();

        if (cancelled) return;

        if (createErr) {
          console.error('Profile create error:', createErr.message);
        } else if (created) {
          setProfile(created as Profile);
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const signUp = async (email: string, password: string, username: string) => {
    const { data: clash } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('username', username)
      .maybeSingle();

    if (clash) {
      return { error: 'That username is already taken (names are case-insensitive — "John" and "john" count as the same).' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign-up failed. Please try again.' };

    if (data.session) {
      const { error: profileErr } = await supabase
        .from('profiles')
        .insert({ user_id: data.user.id, username });

      if (profileErr) {
        if (profileErr.code === '23505') {
          return { error: 'That username is already taken (names are case-insensitive).' };
        }
        return { error: profileErr.message };
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isBanned = checkBanned(profile);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isAdmin: profile?.is_admin ?? false,
        isBanned,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
