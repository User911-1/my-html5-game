import { supabase } from '@/lib/supabase';
import type { AdminPlayer } from '@/lib/supabase';

export async function fetchAdminPlayers(): Promise<AdminPlayer[]> {
  const { data, error } = await supabase
    .from('admin_players_view')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as AdminPlayer[];
}

export async function adminPromote(userId: string): Promise<string | null> {
  const { error } = await supabase.rpc('admin_promote', { target_user_id: userId });
  return error?.message ?? null;
}

export async function adminDemote(userId: string): Promise<string | null> {
  const { error } = await supabase.rpc('admin_demote', { target_user_id: userId });
  return error?.message ?? null;
}

export async function adminBan(
  userId: string,
  banUntilVal: string | null,
  reason: string
): Promise<string | null> {
  const { error } = await supabase.rpc('admin_ban', {
    target_user_id: userId,
    ban_until_val: banUntilVal,
    reason,
  });
  return error?.message ?? null;
}

export async function adminUnban(userId: string): Promise<string | null> {
  const { error } = await supabase.rpc('admin_unban', { target_user_id: userId });
  return error?.message ?? null;
}

export async function adminDeletePlayer(userId: string): Promise<string | null> {
  const { error } = await supabase.rpc('admin_delete_player', { target_user_id: userId });
  return error?.message ?? null;
}

export async function adminSetGameState(
  userId: string,
  score: number,
  totalEarned: number,
  clickPower: number,
  autoRate: number,
  upgrades: Record<string, number>
): Promise<string | null> {
  const { error } = await supabase.rpc('admin_set_game_state', {
    target_user_id: userId,
    new_score: score,
    new_total_earned: totalEarned,
    new_click_power: clickPower,
    new_auto_rate: autoRate,
    new_upgrades: upgrades,
  });
  return error?.message ?? null;
}
