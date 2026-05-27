# ISV Wiki — IEEE Smart Village Knowledge Base

A lightweight, AI-editable wiki for the IEEE Smart Village working group. No build step. No expired SSL certs. Deploys to GitHub Pages with one push.

## Live site

`https://overview-solutions.github.io/isv-wiki`

## What's in here

```
isv-wiki/
├── index.html                   # The wiki — standalone, no dependencies
├── schema/
│   ├── 01_extensions.sql        # PostGIS + TimescaleDB + pgvector extensions
│   ├── 02_core_tables.sql       # Wiki pages, projects, team, standards
│   ├── 03_postgis_tables.sql    # Microgrid assets, site polygons, flight paths
│   ├── 04_timescaledb_tables.sql # ADCP, energy metrics, drone telemetry, MRV events
│   └── 05_pgvector_optional.sql  # Semantic search (enable when ready)
└── .github/
    └── workflows/
        └── deploy.yml           # Auto-deploy to GitHub Pages on push to main
```

## Deploy

### GitHub Pages (recommended)

1. Go to repo **Settings → Pages**
2. Source: **GitHub Actions**
3. Push to `main` — the workflow handles the rest
4. Your wiki lives at `https://overview-solutions.github.io/isv-wiki`

Free SSL via GitHub, auto-renews. No cert expiry ever again.

### Self-hosted

Any static file server works. Copy `index.html` to your server. Point a domain at it. Done.

## AI editing

The wiki has an AI editor built in, powered by the Anthropic API. To enable it:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Click the status indicator in the bottom-left of the sidebar
3. Paste your key — it's stored only in your browser's localStorage, never transmitted anywhere except directly to Anthropic

Then click **Edit with AI** on any section and describe the change you want.

## Database (optional)

The wiki is static HTML by default. When you're ready to persist data, connect a PostgreSQL database:

### Recommended: Supabase

Supabase gives you PostGIS, TimescaleDB-compatible time-series, pgvector, and a PostgREST API — free tier to start.

```bash
# 1. Create a project at supabase.com
# 2. Run the schema files in order in the SQL editor:
psql $DATABASE_URL -f schema/01_extensions.sql
psql $DATABASE_URL -f schema/02_core_tables.sql
psql $DATABASE_URL -f schema/03_postgis_tables.sql
psql $DATABASE_URL -f schema/04_timescaledb_tables.sql
# Optional:
psql $DATABASE_URL -f schema/05_pgvector_optional.sql
```

### Data architecture

| Extension | Purpose | ISV data |
|-----------|---------|---------|
| Core Postgres | Relational + JSONB | Wiki pages, projects, team, standards |
| PostGIS | Geometry + spatial queries | OpenAMI assets, site polygons, flight paths, grid topology |
| TimescaleDB | Time-series hypertables | ADCP tidal readings, energy metrics, drone telemetry, MRV events |
| pgvector | Semantic search embeddings | Wiki search, project similarity (optional) |

All four run in **one database** — one connection string, one backup, one `psql` session.

## Editing the wiki

The wiki is a single HTML file. Every section is editable directly:

- **With AI**: Click "Edit with AI", describe what you want, hit Generate, then Apply
- **With code**: Edit `index.html` directly — each section is clearly labelled
- **With a database**: Wire `index.html` to your Supabase PostgREST API and content becomes fully dynamic

Content edits made via the AI editor are saved to `localStorage` in the browser. To make them permanent, copy the text into `index.html` or commit to the database.

## Contributing

Pull requests welcome. For major changes — new sections, database integration, visualization additions — open an issue first.

## License

MIT — use freely, attribute ISV where reasonable.

---

*IEEE Smart Village · Overview Solutions LLC · Built with the Anthropic API*
