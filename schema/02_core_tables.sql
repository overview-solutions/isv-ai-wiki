-- ISV Wiki Database — Core Relational Tables
-- Wiki pages, projects, team, standards

-- ─────────────────────────────────────────────
-- Wiki pages + revision history
-- ─────────────────────────────────────────────

CREATE TABLE wiki_pages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,          -- e.g. 'mission', 'openami'
  title        TEXT NOT NULL,
  content      JSONB NOT NULL DEFAULT '{}',   -- flexible section blocks
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wiki_revisions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id          UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  content          JSONB NOT NULL,
  edit_instruction TEXT,                       -- what the AI was asked to do
  author           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON wiki_revisions (page_id, created_at DESC);
CREATE INDEX ON wiki_pages USING GIN (content jsonb_path_ops);
CREATE INDEX ON wiki_pages USING GIN (to_tsvector('english', title));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wiki_pages_updated_at
  BEFORE UPDATE ON wiki_pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
-- Projects
-- ─────────────────────────────────────────────

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('active', 'pilot', 'planning', 'archived')),
  description TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',   -- flexible: funding, partners, links
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
-- Team members
-- ─────────────────────────────────────────────

CREATE TABLE team_members (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT NOT NULL,
  initials TEXT NOT NULL,
  role     TEXT NOT NULL,
  focus    TEXT,
  contact  JSONB NOT NULL DEFAULT '{}',     -- email, linkedin, github, etc.
  active   BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'
);

-- ─────────────────────────────────────────────
-- Standards registry
-- ─────────────────────────────────────────────

CREATE TABLE standards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  abbreviation TEXT,
  description  TEXT,
  url          TEXT,
  relevance    TEXT,                         -- ISV-specific relevance note
  category     TEXT                          -- 'comms', 'data', 'operations', 'grid'
);

-- ─────────────────────────────────────────────
-- Seed data
-- ─────────────────────────────────────────────

INSERT INTO wiki_pages (slug, title, content) VALUES
  ('mission',   'Mission',       '{"body": "IEEE Smart Village accelerates sustainable energy access."}'),
  ('funded',    'Funded Projects', '{}'),
  ('tech',      'Tech Committee',  '{}'),
  ('standards', 'Standards',     '{}'),
  ('data',      'Open Data',     '{}'),
  ('team',      'Team',          '{}'),
  ('resources', 'Resources',     '{}');

INSERT INTO projects (name, slug, status, description, metadata) VALUES
  ('Smart Village Project Map', 'project-map', 'active',
   'RemoteMonitorMap — geolocated funded deployments on OSM power layers.',
   '{"kind":"tech"}'),
  ('OpenAMI — Open Microgrid Interface', 'openami', 'active',
   'GeoJSON data model for interoperable microgrid asset management.',
   '{"kind":"tech"}'),
  ('Drone Ops — Crop Health & Environmental Monitoring', 'drone-ops', 'active',
   'BVLOS aerial monitoring for crop health and environmental measurement.',
   '{"kind":"tech"}'),
  ('SunBlazer — Community Solar Charging Station', 'sunblazer', 'active',
   'Portable PV charging station deployed at funded field sites.',
   '{"kind":"toolkit"}'),
  ('Portable Battery Kit (PBK)', 'pbk', 'active',
   'Hot-swappable battery kits leased through NGO energy businesses.',
   '{"kind":"toolkit"}');

INSERT INTO standards (name, abbreviation, description, category, relevance) VALUES
  ('IEEE Smart Energy Profile', 'IEEE 2030.5', 'RESTful protocol for DER communication.', 'comms', 'Core compatibility target for OpenAMI data model.'),
  ('SunSpec Modbus / JSON',     'SunSpec',     'Device-level standards for solar inverters and storage.', 'data', 'OpenAMI models align to SunSpec object definitions.'),
  ('GeoJSON',                   'GeoJSON',     'Open standard for geospatial data interchange.', 'data', 'Primary format for OpenAMI spatial schema.'),
  ('FAA BVLOS Operations',      'BVLOS',       'Beyond visual line of sight UAS framework.', 'operations', 'Governs ISV drone MRV operations.');
