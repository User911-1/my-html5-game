/*
# Clicker Game — Schema, Profiles, Game State, Leaderboard

## Overview
Creates the data layer for a persistent clicker game with user accounts.
Usernames are case-insensitively unique (you cannot register "John" if "john" exists).
Game state (score, click power, auto-production rate, owned upgrades) is saved per user.
A leaderboard view ranks all players by total cookies earned.

## Tables

### profiles
- `user_id` (uuid, PK, references auth.users, cascade delete) — defaults to the authenticated user
- `username` (text, NOT NULL) — display name, must be unique case-insensitively
- `created_at` (timestamptz, default now())
- Unique index on `lower(username)` enforces case-insensitive uniqueness

### game_state
- `user_id` (uuid, PK, references auth.users, cascade delete) — defaults to the authenticated user
- `score` (bigint, default 0) — current cookies (unspent)
- `total_earned` (bigint, default 0) — lifetime cookies earned (drives leaderboard)
- `click_power` (integer, default 1) — cookies gained per manual click
- `auto_rate` (numeric(20,2), default 0) — cookies per second from auto-producers
- `upgrades` (jsonb, default '{}') — map of upgrade_id -> level owned
- `last_saved` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### Views
- `leaderboard` — security_invoker view joining profiles + game_state, ranked by total_earned desc

## Security
- RLS enabled on profiles and game_state
- profiles: authenticated can read all (for leaderboard names), insert/update own only
- game_state: authenticated can read all (for leaderboard), insert/update own only
- leaderboard view: security_invoker, readable by authenticated
- All tables grant only the verbs and roles needed
*/

-- ===== profiles =====
CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- case-insensitive unique username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON profiles (lower(username));

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== game_state =====
CREATE TABLE IF NOT EXISTS game_state (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score bigint NOT NULL DEFAULT 0,
  total_earned bigint NOT NULL DEFAULT 0,
  click_power integer NOT NULL DEFAULT 1,
  auto_rate numeric(20,2) NOT NULL DEFAULT 0,
  upgrades jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_saved timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON game_state TO authenticated;

DROP POLICY IF EXISTS "game_state_select_all" ON game_state;
CREATE POLICY "game_state_select_all"
  ON game_state FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "game_state_insert_own" ON game_state;
CREATE POLICY "game_state_insert_own"
  ON game_state FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "game_state_update_own" ON game_state;
CREATE POLICY "game_state_update_own"
  ON game_state FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== leaderboard view =====
DROP VIEW IF EXISTS leaderboard;
CREATE VIEW leaderboard WITH (security_invoker = true) AS
SELECT
  p.user_id,
  p.username,
  gs.score,
  gs.total_earned,
  RANK() OVER (ORDER BY gs.total_earned DESC) AS rank
FROM profiles p
JOIN game_state gs ON p.user_id = gs.user_id;

GRANT SELECT ON leaderboard TO authenticated;
