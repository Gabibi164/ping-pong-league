-- ============================================================
-- PING PONG LEAGUE — Supabase Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tables ──────────────────────────────────────────────────

CREATE TABLE players (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  group_name TEXT NOT NULL CHECK (group_name IN ('A', 'B')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- matches covers both group-stage games and playoff games/series games.
-- For group stage: phase='group', leg=1 (aller) or 2 (retour), series_id=NULL
-- For playoffs:    phase='semi'|'barrage'|'final', series_id groups games of the same series, game_number=1..N
CREATE TABLE matches (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player1_id    UUID NOT NULL REFERENCES players(id),
  player2_id    UUID NOT NULL REFERENCES players(id),
  player1_sets  INTEGER CHECK (player1_sets >= 0),
  player2_sets  INTEGER CHECK (player2_sets >= 0),
  phase         TEXT NOT NULL DEFAULT 'group'
                  CHECK (phase IN ('group', 'semi', 'barrage', 'final')),
  group_name    TEXT CHECK (group_name IN ('A', 'B')), -- NULL for playoffs
  leg           INTEGER NOT NULL DEFAULT 1,            -- 1=aller, 2=retour (group only)
  series_id     UUID,                                  -- same UUID for all games in a playoff series
  game_number   INTEGER NOT NULL DEFAULT 1,            -- game index within a playoff series
  max_wins      INTEGER,                               -- 2 for semi/barrage, 3 for final (NULL for group)
  is_played     BOOLEAN NOT NULL DEFAULT FALSE,
  played_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CHECK (player1_id != player2_id)
);

-- ─── Disable RLS (internal office app, all users are trusted) ──
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;

-- ─── Enable Realtime ─────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- ─── Seed Players ────────────────────────────────────────────
INSERT INTO players (name, group_name) VALUES
  ('Julie',   'A'),
  ('Edouard', 'A'),
  ('Ninon',   'A'),
  ('Gabriel', 'A'),
  ('Louis',   'A'),
  ('Nicolas', 'B'),
  ('Gaëtan',  'B'),
  ('Elliot',  'B'),
  ('Paul',    'B'),
  ('Alix',    'B'),
  ('Regis',   'B');

-- ─── Generate Group-Stage Matches (aller-retour) ─────────────
-- Group A: 5 players × 4 opponents × 2 legs = 20 matches
-- Group B: 20 matches
-- Total: 40 group-stage matches

DO $$
DECLARE
  group_a TEXT[] := ARRAY['Julie','Edouard','Ninon','Gabriel','Louis'];
  group_b TEXT[] := ARRAY['Nicolas','Gaëtan','Elliot','Paul','Alix','Regis'];
  p1 UUID;
  p2 UUID;
  i  INT;
  j  INT;
BEGIN
  -- Group A
  FOR i IN 1..5 LOOP
    FOR j IN (i+1)..5 LOOP
      SELECT id INTO p1 FROM players WHERE name = group_a[i];
      SELECT id INTO p2 FROM players WHERE name = group_a[j];
      INSERT INTO matches (player1_id, player2_id, phase, group_name, leg)
        VALUES (p1, p2, 'group', 'A', 1);
      INSERT INTO matches (player1_id, player2_id, phase, group_name, leg)
        VALUES (p2, p1, 'group', 'A', 2);
    END LOOP;
  END LOOP;

  -- Group B
  FOR i IN 1..6 LOOP
    FOR j IN (i+1)..6 LOOP
      SELECT id INTO p1 FROM players WHERE name = group_b[i];
      SELECT id INTO p2 FROM players WHERE name = group_b[j];
      INSERT INTO matches (player1_id, player2_id, phase, group_name, leg)
        VALUES (p1, p2, 'group', 'B', 1);
      INSERT INTO matches (player1_id, player2_id, phase, group_name, leg)
        VALUES (p2, p1, 'group', 'B', 2);
    END LOOP;
  END LOOP;
END $$;
