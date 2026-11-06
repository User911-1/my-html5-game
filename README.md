# Cookie Clicker

A clicker game built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Features

- User registration and login (case-insensitive unique usernames)
- Cookie clicking with floating number animations
- 10 upgrades across click power and auto-producer categories
- Auto-saving (every 5 seconds, on tab switch, and on logout)
- Live leaderboard ranking all players by total cookies earned
- Admin panel for the first registered player:
  - Promote/demote other players to admin
  - Ban players for a fixed duration or permanently
  - Unban players
  - Delete player accounts permanently
  - Edit any player's game state (score, upgrades, click power, auto rate)
- Banned players see a banned screen instead of the game

## Tech Stack

- React 18 + TypeScript
- Vite 7
- Tailwind CSS 3
- Supabase (auth, database, RLS, SECURITY DEFINER functions)
- lucide-react for icons

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key
3. Run `npm install`
4. Run `npm run dev` to start the dev server
5. The first player to register automatically becomes the admin

## Database Migrations

The SQL migrations are in `supabase/migrations/`. Run them in order against your Supabase project.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run typecheck` — type checking
- `npm run lint` — eslint
