-- ============================================================
-- HoopIQ NBA Analytics — Supabase Schema
-- Run this entire file in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Teams ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id            SERIAL PRIMARY KEY,
  nba_id        INTEGER UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  city          TEXT NOT NULL,
  abbreviation  TEXT NOT NULL,
  conference    TEXT CHECK (conference IN ('East', 'West')),
  division      TEXT,
  color_primary TEXT,
  color_secondary TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Players ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id            SERIAL PRIMARY KEY,
  nba_id        INTEGER UNIQUE NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  team_id       INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  position      TEXT,
  jersey_number TEXT,
  height        TEXT,
  weight        TEXT,
  birthdate     DATE,
  country       TEXT,
  school        TEXT,
  draft_year    INTEGER,
  draft_round   INTEGER,
  draft_number  INTEGER,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Games ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS games (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nba_game_id   TEXT UNIQUE NOT NULL,
  home_team_id  INTEGER REFERENCES teams(id),
  away_team_id  INTEGER REFERENCES teams(id),
  game_date     DATE NOT NULL,
  game_time     TEXT,
  status        INTEGER DEFAULT 1,   -- 1=scheduled, 2=live, 3=final
  status_text   TEXT,
  period        INTEGER DEFAULT 0,
  home_score    INTEGER DEFAULT 0,
  away_score    INTEGER DEFAULT 0,
  home_win_prob INTEGER DEFAULT 50,
  arena         TEXT,
  city          TEXT,
  season        TEXT DEFAULT '2024-25',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Team Stats ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_stats (
  id            SERIAL PRIMARY KEY,
  team_id       INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  season        TEXT NOT NULL DEFAULT '2024-25',
  games_played  INTEGER DEFAULT 0,
  wins          INTEGER DEFAULT 0,
  losses        INTEGER DEFAULT 0,
  win_pct       DECIMAL(5,3),
  ppg           DECIMAL(5,1),  -- points per game
  opp_ppg       DECIMAL(5,1),  -- opponent ppg
  fg_pct        DECIMAL(5,1),
  fg3_pct       DECIMAL(5,1),
  ft_pct        DECIMAL(5,1),
  rpg           DECIMAL(5,1),  -- rebounds
  apg           DECIMAL(5,1),  -- assists
  spg           DECIMAL(5,1),  -- steals
  bpg           DECIMAL(5,1),  -- blocks
  tpg           DECIMAL(5,1),  -- turnovers
  off_rtg       DECIMAL(6,1),  -- offensive rating
  def_rtg       DECIMAL(6,1),  -- defensive rating
  net_rtg       DECIMAL(6,1),  -- net rating
  pace          DECIMAL(6,1),
  plus_minus    DECIMAL(6,1),
  home_record   TEXT,
  away_record   TEXT,
  last10        TEXT,
  streak        TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, season)
);

-- ── Player Stats ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_stats (
  id            SERIAL PRIMARY KEY,
  player_id     INTEGER REFERENCES players(id) ON DELETE CASCADE,
  season        TEXT NOT NULL DEFAULT '2024-25',
  games_played  INTEGER DEFAULT 0,
  minutes       DECIMAL(5,1),
  ppg           DECIMAL(5,1),
  rpg           DECIMAL(5,1),
  apg           DECIMAL(5,1),
  spg           DECIMAL(5,1),
  bpg           DECIMAL(5,1),
  tpg           DECIMAL(5,1),
  fg_pct        DECIMAL(5,1),
  fg3_pct       DECIMAL(5,1),
  ft_pct        DECIMAL(5,1),
  ts_pct        DECIMAL(5,1),  -- true shooting %
  efg_pct       DECIMAL(5,1),  -- effective FG %
  plus_minus    DECIMAL(6,1),
  off_rtg       DECIMAL(6,1),
  def_rtg       DECIMAL(6,1),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, season)
);

-- ── Injuries ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS injuries (
  id            SERIAL PRIMARY KEY,
  player_id     INTEGER REFERENCES players(id) ON DELETE CASCADE,
  team_id       INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  status        TEXT CHECK (status IN ('OUT', 'GTD', 'DAY-TO-DAY', 'QUESTIONABLE')),
  injury_type   TEXT NOT NULL,
  body_part     TEXT,
  return_date   DATE,
  notes         TEXT,
  reported_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── News ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  headline      TEXT NOT NULL,
  summary       TEXT,
  category      TEXT,
  team_id       INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  player_id     INTEGER REFERENCES players(id) ON DELETE SET NULL,
  source        TEXT,
  url           TEXT,
  image_url     TEXT,
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Predictions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS predictions (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id       UUID REFERENCES games(id) ON DELETE CASCADE,
  home_win_prob INTEGER NOT NULL DEFAULT 50,
  away_win_prob INTEGER NOT NULL DEFAULT 50,
  predicted_winner_id INTEGER REFERENCES teams(id),
  confidence    TEXT CHECK (confidence IN ('High', 'Medium', 'Low')),
  factors       JSONB,           -- array of factor strings
  ai_analysis   TEXT,
  was_correct   BOOLEAN,        -- filled in after game ends
  model_version TEXT DEFAULT 'v1',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Power Rankings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS power_rankings (
  id            SERIAL PRIMARY KEY,
  team_id       INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  season        TEXT NOT NULL DEFAULT '2024-25',
  week          INTEGER NOT NULL,
  rank          INTEGER NOT NULL,
  previous_rank INTEGER,
  power_score   DECIMAL(6,2),
  trend         TEXT CHECK (trend IN ('up', 'down', 'same')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, season, week)
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_games_date       ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_status     ON games(status);
CREATE INDEX IF NOT EXISTS idx_injuries_status  ON injuries(status);
CREATE INDEX IF NOT EXISTS idx_news_published   ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_season ON player_stats(season);
CREATE INDEX IF NOT EXISTS idx_team_stats_season   ON team_stats(season);

-- ── Row Level Security (optional — enable for production) ─────
-- ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read" ON teams FOR SELECT USING (true);

-- ── Sample check ─────────────────────────────────────────────
-- After running this schema, verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
