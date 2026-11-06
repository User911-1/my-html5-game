import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type GameState = {
  user_id: string;
  score: number;
  total_earned: number;
  click_power: number;
  auto_rate: number;
  upgrades: Record<string, number>;
  last_saved: string;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  username: string;
  is_admin: boolean;
  ban_until: string | null;
  banned_by: string | null;
  created_at: string;
};

export type LeaderboardEntry = {
  user_id: string;
  username: string;
  score: number;
  total_earned: number;
  rank: number;
};

export type AdminPlayer = {
  user_id: string;
  username: string;
  is_admin: boolean;
  ban_until: string | null;
  banned_by: string | null;
  created_at: string;
  score: number;
  total_earned: number;
  click_power: number;
  auto_rate: number;
  upgrades: Record<string, number>;
  is_currently_banned: boolean;
};
