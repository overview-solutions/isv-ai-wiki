-- ISV Wiki Database — TimescaleDB Time-Series Tables
-- Requires: 01_extensions.sql, 02_core_tables.sql, 03_postgis_tables.sql

-- ─────────────────────────────────────────────
-- ADCP tidal measurements
-- High-frequency acoustic doppler current profiler data
-- ─────────────────────────────────────────────

CREATE TABLE adcp_readings (
  time             TIMESTAMPTZ   NOT NULL,
  site_id          UUID          REFERENCES site_polygons(id) ON DELETE SET NULL,
  depth_m          FLOAT         NOT NULL,
  velocity_east    FLOAT,        -- m/s (positive = eastward)
  velocity_north   FLOAT,        -- m/s (positive = northward)
  velocity_up      FLOAT,        -- m/s (positive = upward)
  speed            FLOAT,        -- magnitude m/s
  backscatter      FLOAT,        -- dB
  temperature_c    FLOAT,
  metadata         JSONB         NOT NULL DEFAULT '{}'
);

SELECT create_hypertable('adcp_readings', 'time', chunk_time_interval => INTERVAL '1 week');
CREATE INDEX ON adcp_readings (site_id, time DESC);

-- Hourly aggregate for tidal resource analysis
CREATE MATERIALIZED VIEW adcp_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS hour,
  site_id,
  avg(speed)            AS avg_speed_ms,
  max(speed)            AS max_speed_ms,
  avg(velocity_east)    AS avg_vel_east,
  avg(velocity_north)   AS avg_vel_north
FROM adcp_readings
GROUP BY 1, 2
WITH NO DATA;

SELECT add_continuous_aggregate_policy('adcp_hourly',
  start_offset => INTERVAL '1 month',
  end_offset   => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- ─────────────────────────────────────────────
-- Microgrid energy metrics
-- Per-asset production and consumption
-- ─────────────────────────────────────────────

CREATE TABLE energy_metrics (
  time       TIMESTAMPTZ NOT NULL,
  asset_id   UUID        REFERENCES microgrid_assets(id) ON DELETE SET NULL,
  power_w    FLOAT,      -- instantaneous watts (positive = generation, negative = load)
  energy_wh  FLOAT,      -- watt-hours since last reading
  voltage_v  FLOAT,
  current_a  FLOAT,
  frequency_hz FLOAT,
  soc_pct    FLOAT,      -- battery state of charge %
  metadata   JSONB       NOT NULL DEFAULT '{}'
);

SELECT create_hypertable('energy_metrics', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ON energy_metrics (asset_id, time DESC);

-- Daily energy summary per asset
CREATE MATERIALIZED VIEW energy_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time) AS day,
  asset_id,
  avg(power_w)       AS avg_power_w,
  sum(energy_wh)     AS total_energy_wh,
  max(power_w)       AS peak_power_w,
  avg(soc_pct)       AS avg_soc_pct
FROM energy_metrics
GROUP BY 1, 2
WITH NO DATA;

SELECT add_continuous_aggregate_policy('energy_daily',
  start_offset => INTERVAL '3 months',
  end_offset   => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

-- ─────────────────────────────────────────────
-- Drone telemetry
-- Position, attitude, and battery at ~1 Hz
-- ─────────────────────────────────────────────

CREATE TABLE drone_telemetry (
  time         TIMESTAMPTZ NOT NULL,
  flight_id    UUID        REFERENCES flight_paths(id) ON DELETE SET NULL,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  altitude_m   FLOAT,
  speed_ms     FLOAT,
  heading_deg  FLOAT,
  roll_deg     FLOAT,
  pitch_deg    FLOAT,
  battery_pct  FLOAT,
  signal_rssi  FLOAT,
  metadata     JSONB       NOT NULL DEFAULT '{}'
);

SELECT create_hypertable('drone_telemetry', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ON drone_telemetry (flight_id, time DESC);

-- ─────────────────────────────────────────────
-- MRV log events
-- Measurement, reporting, and verification events
-- ─────────────────────────────────────────────

CREATE TABLE mrv_events (
  time        TIMESTAMPTZ NOT NULL,
  event_type  TEXT        NOT NULL,  -- 'carbon_flux', 'methane_detect', 'ndvi_reading', 'alkalinity'
  site_id     UUID        REFERENCES site_polygons(id) ON DELETE SET NULL,
  flight_id   UUID        REFERENCES flight_paths(id) ON DELETE SET NULL,
  value       FLOAT,
  unit        TEXT,
  confidence  FLOAT       CHECK (confidence BETWEEN 0 AND 1),
  source      TEXT,                  -- 'drone_lidar', 'drone_hyperspectral', 'ground_sensor', 'satellite'
  metadata    JSONB       NOT NULL DEFAULT '{}'
);

SELECT create_hypertable('mrv_events', 'time', chunk_time_interval => INTERVAL '1 month');
CREATE INDEX ON mrv_events (event_type, time DESC);
CREATE INDEX ON mrv_events (site_id, time DESC);

-- ─────────────────────────────────────────────
-- Compression policies (reduce storage 5-10x)
-- ─────────────────────────────────────────────

ALTER TABLE adcp_readings    SET (timescaledb.compress, timescaledb.compress_segmentby = 'site_id');
ALTER TABLE energy_metrics   SET (timescaledb.compress, timescaledb.compress_segmentby = 'asset_id');
ALTER TABLE drone_telemetry  SET (timescaledb.compress, timescaledb.compress_segmentby = 'flight_id');
ALTER TABLE mrv_events       SET (timescaledb.compress, timescaledb.compress_segmentby = 'event_type');

SELECT add_compression_policy('adcp_readings',   INTERVAL '1 month');
SELECT add_compression_policy('energy_metrics',  INTERVAL '1 week');
SELECT add_compression_policy('drone_telemetry', INTERVAL '1 week');
SELECT add_compression_policy('mrv_events',      INTERVAL '1 month');
