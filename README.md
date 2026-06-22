# ISV Knowledge Base

Static wiki for the IEEE Smart Village working group. **No install, no build step** — HTML files + GitHub Pages.

## Try it (30 seconds)

**Live:** [overview-solutions.github.io/isv-ai-wiki](https://overview-solutions.github.io/isv-ai-wiki)

**Local:**

```bash
git clone git@github.com:overview-solutions/isv-ai-wiki.git
cd isv-ai-wiki
./preview.sh
```

Open [http://localhost:8765/index.html](http://localhost:8765/index.html) — use the sidebar to browse.

| Section | What it is |
|---------|------------|
| **Meeting notes** | Internal Tech Comm call notes (tables, action items, embedded diagrams) |
| **Technical reports** | Dev Labs + ISV reports (`catalog.json`) — summaries here, full docs linked |
| **Everything else** | Mission, funded projects map, standards, team, resources |

Direct links (live site):

- [Metering topology meeting note](https://overview-solutions.github.io/isv-ai-wiki/index.html#notes/metering-2026-05-28)
- [Circles of Power · ISV-HCK-001](https://overview-solutions.github.io/isv-ai-wiki/index.html#tech-reports/isv-hck-2025-circles-of-power)
- [Technical reports](https://overview-solutions.github.io/isv-ai-wiki/index.html#tech-reports)
- [Dev Labs report library](https://sattal.cottonspace.com/reports) (full documents)
- [Source repo — openami-smart-village](https://github.com/rahulbhargavain/openami-smart-village/tree/main/reports) (reports on GitHub)

---

## Add content

### Meeting notes

1. Copy `tech-comm-2026-05-28-metering-topology.html` as a template.
2. Register the note in `index.html` → `MEETING_NOTES` (sidebar + iframe preview).
3. Push to `main` — GitHub Pages updates in ~1 min.

### Technical reports

Reports are **indexed** in the wiki, **hosted** on Cottonspace, and **maintained** in GitHub:

- Browse summaries in the wiki → **Technical reports** sidebar
- Open the full document via **Open full report ↗**
- Live library: [sattal.cottonspace.com/reports](https://sattal.cottonspace.com/reports)
- Source repo: [github.com/rahulbhargavain/openami-smart-village](https://github.com/rahulbhargavain/openami-smart-village/tree/main/reports)

Reports use IDs like **EMG-TRD-005** = *Emerging markets · Technical reference · #005*. See the collapsible key on the Technical reports page. Cottonspace entries sync via:

```bash
cd isv-ai-wiki
python3 technical-notes/sync-catalog.py
```

Wiki-only entries (e.g. **ISV-HCK-001**) have `"syncProtected": true` and are preserved by the sync script.

To add ISV-specific context manually, edit fields in `technical-notes/catalog.json`:

```json
{
  "id": "short-slug",
  "reportCode": "EMG-XXX-000",
  "title": "…",
  "publisher": "Cottonspace Dev Labs",
  "published": "May 2026",
  "type": "technical-reference",
  "category": "Technical Reference",
  "tags": ["OpenAMI", "metering"],
  "url": "https://sattal.cottonspace.com/reports/your-report.html",
  "sourceFile": "reports/your-report.html",
  "githubUrl": "https://github.com/rahulbhargavain/openami-smart-village/blob/main/reports/your-report.html",
  "sourceCatalog": "cottonspace-dev-labs",
  "summary": "What it is.",
  "isvRelevance": "Why ISV cares.",
  "relatedMeetingNotes": ["metering-2026-05-28"]
}
```

**Integration options** (current vs future):

| Approach | What it does |
|----------|----------------|
| **Catalog index** *(now)* | Wiki lists metadata; links out to Cottonspace for the full report |
| **Catalog sync script** *(now)* | `technical-notes/sync-catalog.py` pulls from openami-smart-village GitHub |
| **Self-hosted copy** *(future)* | Mirror report HTML into this repo for offline / archival |
| **Iframe embed** *(future)* | Show report inline in the detail panel (needs Cottonspace embed consent) |

Refresh the wiki after editing the catalog. Old `#tech-notes/…` links still work; new links use `#tech-reports/…`.

### Network diagram (SVG)

The metering topology map is `technical-notes/diagrams/metering-topology.svg`.

On the meeting note page, above the diagram:

1. **Download SVG**
2. **Import into diagrams.net** → File → Import From → Device
3. Export SVG, replace the file in the repo, refresh

Text-only tweaks: edit the `.svg` in Cursor (see `technical-notes/diagrams/EDITING.md`).

---

## Repo layout

```
isv-ai-wiki/
├── index.html                          # Wiki shell + navigation
├── preview.sh                          # Local server (port 8765)
├── tech-comm-*-*.html                  # Meeting note pages
├── stonehenge-microgrid-topology.html  # Open Energy Hackathon concept (Apr 2025)
├── technical-notes/
│   ├── catalog.json                    # Technical reports index
│   ├── sync-catalog.py                 # Sync from openami-smart-village GitHub
│   └── diagrams/                       # SVG diagrams for meeting notes
├── js/                                 # Funded projects map embed
├── schema/                             # Optional Postgres schema (future)
└── .github/workflows/deploy.yml        # Deploy to GitHub Pages on push
```

---

## Deploy

Push to `main`. The workflow publishes to GitHub Pages automatically.

Site URL: `https://overview-solutions.github.io/isv-ai-wiki`

First-time setup: repo **Settings → Pages → Source: GitHub Actions**.

---

## Optional

**AI editing** — sidebar status dot → paste an [Anthropic API key](https://console.anthropic.com) → **Edit with AI** on any section. Key stays in your browser only.

**Database** — `schema/*.sql` is for a future Postgres/Supabase backend. The wiki runs fine without it today.

**Mapbox** — embedded funded-projects map needs `MAPBOX_PUBLIC_TOKEN` as a GitHub Actions secret (see `deploy.yml`). Without it, the map shows a setup message.

---

## Contributing

Pull requests welcome. For a new meeting note or catalog entry, a small focused PR is enough — no issue required.

MIT · IEEE Smart Village · Overview Solutions LLC
