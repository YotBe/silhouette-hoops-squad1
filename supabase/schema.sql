-- WHO IS IT? — Supabase Schema
-- Run this in the Supabase SQL editor at https://app.supabase.com

-- ── Global Leaderboard ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sg_leaderboard (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name  text NOT NULL DEFAULT 'Anonymous',
  score        integer NOT NULL,
  tier         text NOT NULL,         -- 'rookie' | 'pro' | 'allstar' | 'mvp' | 'legend' | 'buzzer' | 'heatcheck' | 'daily'
  streak       integer NOT NULL DEFAULT 0,
  accuracy     integer NOT NULL DEFAULT 0,  -- 0-100
  season_week  integer NOT NULL,            -- YYYYWW  e.g. 202611
  created_at   timestamptz DEFAULT now()
);

-- Efficient queries: "top scores for tier X in season Y"
CREATE INDEX IF NOT EXISTS sg_leaderboard_tier_season_score
  ON sg_leaderboard (tier, season_week, score DESC);

-- Enable Row Level Security
ALTER TABLE sg_leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "sg_leaderboard_read"
  ON sg_leaderboard FOR SELECT USING (true);

-- Anyone can insert (scores submitted client-side)
CREATE POLICY "sg_leaderboard_insert"
  ON sg_leaderboard FOR INSERT WITH CHECK (
    length(player_name) <= 30
    AND score >= 0
    AND score <= 999999
  );

-- ── Live Duels ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sg_duels (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code            text UNIQUE NOT NULL,
  host_name            text NOT NULL,
  guest_name           text,
  player_ids           text[] NOT NULL,          -- 5 player IDs in order
  host_score           integer NOT NULL DEFAULT 0,
  guest_score          integer NOT NULL DEFAULT 0,
  host_current_round   integer NOT NULL DEFAULT 0,
  guest_current_round  integer NOT NULL DEFAULT 0,
  status               text NOT NULL DEFAULT 'waiting',  -- waiting | playing | done
  created_at           timestamptz DEFAULT now(),
  expires_at           timestamptz DEFAULT (now() + interval '1 hour')
);

CREATE INDEX IF NOT EXISTS sg_duels_room_code ON sg_duels (room_code);
CREATE INDEX IF NOT EXISTS sg_duels_expires   ON sg_duels (expires_at);

ALTER TABLE sg_duels ENABLE ROW LEVEL SECURITY;

-- Anyone can read rooms (needed to join by code)
CREATE POLICY "sg_duels_read"   ON sg_duels FOR SELECT USING (true);
-- Anyone can create a room
CREATE POLICY "sg_duels_insert" ON sg_duels FOR INSERT WITH CHECK (
  length(room_code) = 6 AND array_length(player_ids, 1) = 5
);
-- Anyone can update a room they're part of (score updates, join)
CREATE POLICY "sg_duels_update" ON sg_duels FOR UPDATE USING (true);

-- Enable Realtime on duels so hosts see guest joins immediately
ALTER PUBLICATION supabase_realtime ADD TABLE sg_duels;
