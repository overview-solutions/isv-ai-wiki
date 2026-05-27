-- ISV Wiki Database — pgvector Semantic Search (Optional)
-- Requires: 01_extensions.sql (vector extension), 02_core_tables.sql
-- Enable when ready to add AI-powered search to the wiki

-- ─────────────────────────────────────────────
-- Embeddings store
-- Vectors for wiki sections, project descriptions, standards
-- ─────────────────────────────────────────────

CREATE TABLE embeddings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type  TEXT NOT NULL,    -- 'wiki_page', 'project', 'standard', 'mrv_event'
  source_id    UUID NOT NULL,
  section      TEXT,             -- e.g. 'body', 'title', 'description'
  content_text TEXT NOT NULL,    -- the raw text that was embedded
  embedding    VECTOR(1536),     -- OpenAI text-embedding-3-small / Anthropic voyage-3
  model        TEXT NOT NULL,    -- which embedding model was used
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index for fast approximate nearest-neighbor search
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX ON embeddings (source_type, source_id);

-- ─────────────────────────────────────────────
-- Semantic search function
-- Returns the top-k most relevant items for a query embedding
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding VECTOR(1536),
  source_filter   TEXT DEFAULT NULL,   -- optional: 'wiki_page', 'project', etc.
  top_k           INT  DEFAULT 5
)
RETURNS TABLE (
  source_type  TEXT,
  source_id    UUID,
  section      TEXT,
  content_text TEXT,
  similarity   FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.source_type,
    e.source_id,
    e.section,
    e.content_text,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE (source_filter IS NULL OR e.source_type = source_filter)
  ORDER BY e.embedding <=> query_embedding
  LIMIT top_k;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- Usage example:
--
-- SELECT * FROM semantic_search(
--   '[0.1, 0.2, ...]'::VECTOR(1536),  -- embed your query first
--   'project',                          -- optional filter
--   5                                   -- top 5 results
-- );
-- ─────────────────────────────────────────────
