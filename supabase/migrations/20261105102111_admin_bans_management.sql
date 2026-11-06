/*
# Admin Roles, Bans, and Admin Management Functions

## Overview
Adds admin roles and ban support to the clicker game. The first player to register
becomes the admin automatically. Admins can:
- Promote/demote other players to admin
- Ban players for a fixed duration or indefinitely
- Unban players
- Delete player accounts permanently
- Edit any player's game state (score, upgrades, click power, auto rate)

## Changes

### profiles table — new columns
- `is_admin` (boolean, default false)
- `ban_until` (timestamptz, nullable) — when the current ban expires (null = permanent)
- `banned_by` (uuid, nullable) — which admin issued the ban

### bans table — new
- `id` (uuid PK)
- `user_id` (uuid, references auth.users, cascade delete)
- `banned_by` (uuid, references auth.users, cascade delete)
- `reason` (text, nullable)
- `ban_until` (timestamptz, nullable) — null means permanent
- `created_at` (timestamptz, default now())

### admin_players_view — new view
A security_invoker view joining profiles + game_state for admin management.

### SECURITY DEFINER functions
- `is_admin(uid uuid)` — helper
- `admin_promote(target_user_id uuid)`
- `admin_demote(target_user_id uuid)`
- `admin_ban(target_user_id uuid, ban_until_val timestamptz, reason text)`
- `admin_unban(target_user_id uuid)`
- `admin_delete_player(target_user_id uuid)`
- `admin_set_game_state(target_user_id uuid, new_score bigint, new_total_earned bigint, new_click_power int, new_auto_rate numeric, new_upgrades jsonb)`
- `admin_set_score(target_user_id uuid, new_score bigint)`
- `admin_set_upgrades(target_user_id uuid, new_upgrades jsonb)`

## Security
- All SECURITY DEFINER functions have EXECUTE revoked from PUBLIC/anon, granted only to authenticated
- profiles table: column-level INSERT/UPDATE grants restricted
- The first profile created is automatically admin via a trigger
*/

-- ===== Add columns to profiles =====
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_until timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_by uuid;

-- ===== bans table =====
CREATE TABLE IF NOT EXISTS bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  ban_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bans ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON bans TO authenticated;

DROP POLICY IF EXISTS "bans_select_all" ON bans;
CREATE POLICY "bans_select_all"
  ON bans FOR SELECT
  TO authenticated USING (true);

-- ===== is_admin helper function =====
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE user_id = uid),
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;

-- ===== Auto-admin trigger: first registered player becomes admin =====
CREATE OR REPLACE FUNCTION set_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM profiles) = 0 THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_first_user_admin() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_first_user_admin ON profiles;
CREATE TRIGGER trg_first_user_admin
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_first_user_admin();

-- ===== admin_promote =====
CREATE OR REPLACE FUNCTION admin_promote(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can promote players';
  END IF;
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'You cannot promote yourself';
  END IF;
  UPDATE profiles SET is_admin = true WHERE user_id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_promote(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_promote(uuid) TO authenticated;

-- ===== admin_demote =====
CREATE OR REPLACE FUNCTION admin_demote(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can demote admins';
  END IF;
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'You cannot demote yourself';
  END IF;
  UPDATE profiles SET is_admin = false WHERE user_id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_demote(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_demote(uuid) TO authenticated;

-- ===== admin_ban =====
CREATE OR REPLACE FUNCTION admin_ban(
  target_user_id uuid,
  ban_until_val timestamptz,
  reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can ban players';
  END IF;
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'You cannot ban yourself';
  END IF;
  IF (SELECT is_admin FROM profiles WHERE user_id = target_user_id) THEN
    RAISE EXCEPTION 'You cannot ban another admin';
  END IF;

  INSERT INTO bans (user_id, banned_by, reason, ban_until)
  VALUES (target_user_id, auth.uid(), reason, ban_until_val);

  UPDATE profiles
  SET ban_until = ban_until_val, banned_by = auth.uid()
  WHERE user_id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_ban(uuid, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_ban(uuid, timestamptz, text) TO authenticated;

-- ===== admin_unban =====
CREATE OR REPLACE FUNCTION admin_unban(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can unban players';
  END IF;

  UPDATE bans SET ban_until = now()
  WHERE user_id = target_user_id
    AND (ban_until IS NULL OR ban_until > now());

  UPDATE profiles
  SET ban_until = now(), banned_by = NULL
  WHERE user_id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_unban(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_unban(uuid) TO authenticated;

-- ===== admin_delete_player =====
CREATE OR REPLACE FUNCTION admin_delete_player(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can delete players';
  END IF;
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'You cannot delete yourself';
  END IF;
  IF (SELECT is_admin FROM profiles WHERE user_id = target_user_id) THEN
    RAISE EXCEPTION 'You cannot delete another admin';
  END IF;

  DELETE FROM profiles WHERE user_id = target_user_id;
  DELETE FROM bans WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_delete_player(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_delete_player(uuid) TO authenticated;

-- ===== admin_set_game_state =====
CREATE OR REPLACE FUNCTION admin_set_game_state(
  target_user_id uuid,
  new_score bigint,
  new_total_earned bigint,
  new_click_power int,
  new_auto_rate numeric,
  new_upgrades jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can edit game state';
  END IF;

  INSERT INTO game_state (user_id, score, total_earned, click_power, auto_rate, upgrades, last_saved, updated_at)
  VALUES (target_user_id, new_score, new_total_earned, new_click_power, new_auto_rate, new_upgrades, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    total_earned = EXCLUDED.total_earned,
    click_power = EXCLUDED.click_power,
    auto_rate = EXCLUDED.auto_rate,
    upgrades = EXCLUDED.upgrades,
    last_saved = now(),
    updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_set_game_state(uuid, bigint, bigint, int, numeric, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_set_game_state(uuid, bigint, bigint, int, numeric, jsonb) TO authenticated;

-- ===== admin_set_score (shorthand) =====
CREATE OR REPLACE FUNCTION admin_set_score(
  target_user_id uuid,
  new_score bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can edit scores';
  END IF;
  UPDATE game_state SET score = new_score, updated_at = now() WHERE user_id = target_user_id;
  IF NOT FOUND THEN
    INSERT INTO game_state (user_id, score, total_earned, click_power, auto_rate, upgrades)
    VALUES (target_user_id, new_score, new_score, 1, 0, '{}'::jsonb);
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_set_score(uuid, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_set_score(uuid, bigint) TO authenticated;

-- ===== admin_set_upgrades (shorthand) =====
CREATE OR REPLACE FUNCTION admin_set_upgrades(
  target_user_id uuid,
  new_upgrades jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can edit upgrades';
  END IF;
  UPDATE game_state SET upgrades = new_upgrades, updated_at = now() WHERE user_id = target_user_id;
  IF NOT FOUND THEN
    INSERT INTO game_state (user_id, score, total_earned, click_power, auto_rate, upgrades)
    VALUES (target_user_id, 0, 0, 1, 0, new_upgrades);
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_set_upgrades(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_set_upgrades(uuid, jsonb) TO authenticated;

-- ===== admin_players_view =====
DROP VIEW IF EXISTS admin_players_view;
CREATE VIEW admin_players_view WITH (security_invoker = true) AS
SELECT
  p.user_id,
  p.username,
  p.is_admin,
  p.ban_until,
  p.banned_by,
  p.created_at,
  COALESCE(gs.score, 0) AS score,
  COALESCE(gs.total_earned, 0) AS total_earned,
  COALESCE(gs.click_power, 1) AS click_power,
  COALESCE(gs.auto_rate, 0) AS auto_rate,
  COALESCE(gs.upgrades, '{}'::jsonb) AS upgrades,
  CASE
    WHEN p.ban_until IS NULL AND p.banned_by IS NOT NULL THEN true
    WHEN p.ban_until IS NOT NULL AND p.ban_until > now() THEN true
    ELSE false
  END AS is_currently_banned
FROM profiles p
LEFT JOIN game_state gs ON p.user_id = gs.user_id
ORDER BY p.created_at ASC;

GRANT SELECT ON admin_players_view TO authenticated;

-- ===== Update profiles column-level grants =====
REVOKE INSERT, UPDATE ON profiles FROM authenticated;
GRANT INSERT (user_id, username) ON profiles TO authenticated;
GRANT UPDATE (username) ON profiles TO authenticated;
GRANT SELECT ON profiles TO authenticated;
