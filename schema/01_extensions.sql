-- ISV Wiki Database — Extension Setup
-- Run this first, as superuser
-- Compatible with PostgreSQL 15+ on Supabase, RDS, or self-hosted

CREATE EXTENSION IF NOT EXISTS postgis;          -- Spatial queries (GeoJSON, geometry)
CREATE EXTENSION IF NOT EXISTS postgis_topology; -- Topological operations
CREATE EXTENSION IF NOT EXISTS timescaledb;      -- Time-series hypertables
CREATE EXTENSION IF NOT EXISTS vector;           -- pgvector: semantic search (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- gen_random_uuid() fallback
CREATE EXTENSION IF NOT EXISTS pg_trgm;          -- Trigram full-text search on wiki pages
