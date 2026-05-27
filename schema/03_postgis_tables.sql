-- ISV Wiki Database — PostGIS Spatial Tables
-- Requires: 01_extensions.sql, 02_core_tables.sql

-- ─────────────────────────────────────────────
-- Microgrid assets (OpenAMI)
-- Each asset is a point with GeoJSON-compatible metadata
-- ─────────────────────────────────────────────

CREATE TABLE microgrid_assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type   TEXT NOT NULL,      -- 'solar_panel', 'battery', 'inverter', 'meter', 'load'
  name         TEXT,
  location     GEOMETRY(Point, 4326) NOT NULL,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  installed_at TIMESTAMPTZ,
  capacity_kw  FLOAT,              -- rated capacity
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON microgrid_assets USING GIST (location);
CREATE INDEX ON microgrid_assets (project_id);
CREATE INDEX ON microgrid_assets (asset_type);

-- ─────────────────────────────────────────────
-- Site polygons
-- Community boundaries, grid zones, survey areas
-- ─────────────────────────────────────────────

CREATE TABLE site_polygons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  polygon      GEOMETRY(Polygon, 4326) NOT NULL,
  polygon_type TEXT NOT NULL,      -- 'community', 'grid_zone', 'survey_area', 'tidal_resource'
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON site_polygons USING GIST (polygon);
CREATE INDEX ON site_polygons (project_id);

-- ─────────────────────────────────────────────
-- Drone flight paths
-- ─────────────────────────────────────────────

CREATE TABLE flight_paths (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_name TEXT,
  path         GEOMETRY(LineString, 4326),
  altitude_m   FLOAT,
  sensor_type  TEXT,               -- 'lidar', 'hyperspectral', 'rgb', 'multispectral'
  aircraft_id  TEXT,               -- e.g. 'Sentaero-6-01'
  flown_at     TIMESTAMPTZ NOT NULL,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  metadata     JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX ON flight_paths USING GIST (path);
CREATE INDEX ON flight_paths (flown_at DESC);

-- ─────────────────────────────────────────────
-- Transmission / grid line segments (LiDAR-derived)
-- ─────────────────────────────────────────────

CREATE TABLE grid_segments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_type    TEXT NOT NULL,   -- 'transmission', 'distribution', 'service_drop'
  geometry        GEOMETRY(LineString, 4326) NOT NULL,
  voltage_kv      FLOAT,
  conductor_type  TEXT,
  condition_score FLOAT CHECK (condition_score BETWEEN 0 AND 1),
  inspected_at    TIMESTAMPTZ,
  flight_id       UUID REFERENCES flight_paths(id) ON DELETE SET NULL,
  metadata        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX ON grid_segments USING GIST (geometry);

-- ─────────────────────────────────────────────
-- Useful spatial views
-- ─────────────────────────────────────────────

-- All assets within a named site polygon
CREATE VIEW assets_by_site AS
SELECT
  sp.name        AS site_name,
  sp.polygon_type,
  ma.id          AS asset_id,
  ma.asset_type,
  ma.name        AS asset_name,
  ma.capacity_kw,
  ST_AsGeoJSON(ma.location)::json AS geojson
FROM site_polygons sp
JOIN microgrid_assets ma
  ON ST_Within(ma.location, sp.polygon);

-- OpenAMI GeoJSON export (FeatureCollection-ready rows)
CREATE VIEW openami_geojson AS
SELECT
  ma.id,
  ma.asset_type,
  ma.name,
  ma.capacity_kw,
  p.name     AS project_name,
  p.status   AS project_status,
  ST_AsGeoJSON(ma.location)::json AS geometry,
  ma.metadata
FROM microgrid_assets ma
LEFT JOIN projects p ON ma.project_id = p.id;
