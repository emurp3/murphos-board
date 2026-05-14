-- ============================================================
-- S.A. Executive AI — Supabase Schema
-- Run this in the Supabase SQL editor or via supabase db push
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- agents
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id            TEXT PRIMARY KEY,               -- e.g. "hunter", "leon"
  name          TEXT NOT NULL,
  domain        TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'idle',   -- online | idle | warning | offline
  last_activity TIMESTAMPTZ,
  active_tasks  INTEGER NOT NULL DEFAULT 0,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default agents
INSERT INTO agents (id, name, domain, description) VALUES
  ('hunter', 'Hunter', 'Automated Trading', 'Stock & crypto trading engine, congressional signals, revenue tracking.'),
  ('leon',   'Leon',   'E-Commerce',        'Etsy / Gumroad / Printful product pipeline, shirt drops.'),
  ('sapp',   'SAPP',   'Creative',          'Music album (June 19 deadline), Gabe''s Return movie production.'),
  ('ao',     'AO',     'Career',            'Job application pipeline, resume tracking, interview prep.'),
  ('optix',  'Optix',  'Research',          'Dissertation progress, Murphy Optics R&D, academic milestones.'),
  ('ninja',  'Ninja Squad', 'Investigations', 'Active investigation cases, research ops, intelligence log.')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id    TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',   -- pending | in_progress | done | blocked | cancelled
  priority    TEXT NOT NULL DEFAULT 'medium',    -- low | medium | high | critical
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);

-- ─────────────────────────────────────────────────────────────
-- memory_entries
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memory_entries (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category   TEXT NOT NULL,
  content    TEXT NOT NULL,
  tags       TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_category ON memory_entries(category);
CREATE INDEX IF NOT EXISTS idx_memory_content_fts ON memory_entries USING gin(to_tsvector('english', content));

-- ─────────────────────────────────────────────────────────────
-- deployment_logs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deployment_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL,
  status       TEXT NOT NULL,   -- live | build_in_progress | deactivated | failed | unknown
  checked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  details      JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_deployment_logs_service ON deployment_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_checked ON deployment_logs(checked_at DESC);

-- ─────────────────────────────────────────────────────────────
-- alerts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level      TEXT NOT NULL DEFAULT 'info',   -- info | warning | critical
  message    TEXT NOT NULL,
  source     TEXT NOT NULL,
  resolved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_level    ON alerts(level);

-- ─────────────────────────────────────────────────────────────
-- reports
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type         TEXT NOT NULL,   -- daily | ecosystem | custom
  content      TEXT NOT NULL,   -- JSON-encoded report body
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_type        ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_generated   ON reports(generated_at DESC);

-- ─────────────────────────────────────────────────────────────
-- agent_reports
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_reports (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id   TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  period     TEXT NOT NULL,   -- e.g. "2024-05-14"
  summary    TEXT NOT NULL,
  metrics    JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_reports_agent  ON agent_reports(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_reports_period ON agent_reports(period);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security (recommended — configure per project)
-- ─────────────────────────────────────────────────────────────
-- ALTER TABLE agents         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alerts         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reports        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_reports  ENABLE ROW LEVEL SECURITY;
