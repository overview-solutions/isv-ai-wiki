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
| **Technical notes** | Team submissions — papers, standards, vendor refs (`catalog.json`, starts empty) |
| **Everything else** | Mission, funded projects map, standards, team, resources |

Direct links (live site):

- [Metering topology meeting note](https://overview-solutions.github.io/isv-ai-wiki/index.html#notes/metering-2026-05-28)
- [Technical notes](https://overview-solutions.github.io/isv-ai-wiki/index.html#tech-notes)

---

## Add content

### Meeting notes

1. Copy `tech-comm-2026-05-28-metering-topology.html` as a template.
2. Register the note in `index.html` → `MEETING_NOTES` (sidebar + iframe preview).
3. Push to `main` — GitHub Pages updates in ~1 min.

### Technical notes (publications & references)

Edit `technical-notes/catalog.json` — one object per submission:

```json
{
  "id": "short-slug",
  "title": "…",
  "publisher": "…",
  "published": "2024",
  "type": "paper",
  "tags": ["metering", "AMI"],
  "url": "https://…",
  "summary": "What it is.",
  "isvRelevance": "Why ISV cares.",
  "relatedMeetingNotes": ["metering-2026-05-28"]
}
```

Refresh the wiki. Entries show under **Technical notes** in the sidebar.

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
├── technical-notes/
│   ├── catalog.json                    # Technical notes submissions
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
