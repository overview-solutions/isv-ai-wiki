# ISV Knowledge Base

Static wiki for the IEEE Smart Village working group. **No install, no build step** — HTML files + GitHub Pages.

**AI assistants:** read [`AGENTS.md`](AGENTS.md) first — navigation, trust hierarchy, meter benchmark framework, and contributor rules.

## Public by default, private by necessity

This wiki is **open** — anyone can read it. A small amount of material (vendor contacts and outreach status, real pricing, NDA-gated docs, unconsented personal details) is kept in a **separate access-controlled repo**, [`isv-ai-wiki-private`](https://github.com/overview-solutions/isv-ai-wiki-private). We publish the rules so you can see exactly what we protect and why:

- **[`SHARING-POLICY.md`](SHARING-POLICY.md)** — what's public, what's private, and how to request access (this doc is itself public, on purpose).
- Contributors & AI assistants: the boundary is one-directional — private may inform public in the abstract, but no private fact, name, price, or NDA quote is ever copied into a public file. See [`AGENTS.md`](AGENTS.md) → *Public / private split*.
- Editing both at once? Open [`isv-wiki.code-workspace`](isv-wiki.code-workspace) in Cursor/VS Code for a multi-root view of both repos as shared context.

## Try it (30 seconds)

**Live:** [overview-solutions.github.io/isv-ai-wiki](https://overview-solutions.github.io/isv-ai-wiki)

**Source (open source):** [github.com/overview-solutions/isv-ai-wiki](https://github.com/overview-solutions/isv-ai-wiki) — MIT license, public repo. Clone, edit, pull request.

**Local:**

```bash
git clone git@github.com:overview-solutions/isv-ai-wiki.git
cd isv-ai-wiki
./preview.sh
```

Open [http://localhost:8765/index.html](http://localhost:8765/index.html) — use the sidebar to browse.

**Do not** double-click `index.html` in Finder — `file://` breaks the Tasks page (and other `fetch` calls). Always use `./preview.sh` or the [deployed site](https://overview-solutions.github.io/isv-ai-wiki/).

| Section | What it is |
|---------|------------|
| **Tasks** | Meeting follow-ups as [GitHub Issues](https://github.com/overview-solutions/isv-ai-wiki/issues) — live board in the wiki |
| **Meeting notes** | Internal Tech Comm call notes (tables, action items, embedded diagrams) |
| **Technical reports** | Dev Labs + ISV reports (`catalog.json`) — summaries here, full docs linked |
| **Everything else** | About ISV, supported projects map, standards, resources |

Direct links (live site):

- [Tasks board (wiki)](https://overview-solutions.github.io/isv-ai-wiki/index.html#tasks) — filter by meeting, status, assignee
- [GitHub Issues (source of truth)](https://github.com/overview-solutions/isv-ai-wiki/issues) — create, comment, assign, close
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

Reports use IDs like **EMG-TRD-005** = *Emerging markets · Technical reference · #005*. See the collapsible key on the Technical reports page.

**Listing (automatic):** Opening Technical reports in the wiki fetches the live [openami-smart-village reports index](https://github.com/rahulbhargavain/openami-smart-village/tree/main/reports) from GitHub (same source [Cottonspace](https://sattal.cottonspace.com/reports) publishes). New reports appear without running a sync script or redeploying.

**Enrichments (manual):** `technical-notes/catalog.json` holds wiki-only entries (e.g. **ISV-HCK-001**, external industry PDFs) and optional ISV context (`isvRelevance`, `relatedMeetingNotes`, provenance tags, tags) merged by report ID. Edit that file when you want richer summaries on specific reports.

**Provenance (optional per item):** `sourceKind` (`dev-labs` | `isv-wiki` | `external`), `authorship` (`human-primary` | `ai-assisted` | `mixed`), `reviewStatus` (`committee-reviewed` | `draft` | `index-only`). Omitted fields use defaults documented in `reportProvenanceGuide`.

Optional — refresh enrichment stubs after bulk Cottonspace changes:

```bash
cd isv-ai-wiki
python3 technical-notes/sync-catalog.py
```

Wiki-only entries have `"syncProtected": true` and are always preserved.

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

### Follow-ups & tasks (GitHub Issues)

Action items from meetings are **not** stored in `tasks.json` anymore. They are **[GitHub Issues](https://github.com/overview-solutions/isv-ai-wiki/issues)** on this repo (`overview-solutions/isv-ai-wiki`).

#### Where to see progress

| View | URL | Best for |
|------|-----|----------|
| **Wiki task board** | [index.html#tasks](https://overview-solutions.github.io/isv-ai-wiki/index.html#tasks) | Summary stats, filters by meeting/status/assignee, links into each issue |
| **Meeting note panel** | Top of each meeting note page (e.g. [#notes/metering-2026-05-28](https://overview-solutions.github.io/isv-ai-wiki/index.html#notes/metering-2026-05-28)) | Follow-ups for that session only |
| **GitHub Issues** | [github.com/…/isv-ai-wiki/issues](https://github.com/overview-solutions/isv-ai-wiki/issues) | Full history — comments, assignees, labels, close/reopen |
| **GitHub Projects** *(optional)* | Repo → **Projects** tab | Kanban across issues if you add a project board |

The wiki reads issues from the public GitHub API on page load. **Create and update on GitHub** — comment for updates, close when done. The wiki reflects changes the next time you open or refresh the Tasks page.

#### Create a follow-up

1. [New issue → Follow-up task template](https://github.com/overview-solutions/isv-ai-wiki/issues/new?template=follow-up)
2. Describe the work, assignee, and context
3. Add a **meeting** label on the issue sidebar, e.g. `meeting-metering-2026-05-28` or `meeting-power-africa-2026-workshop-planning`
4. Optional: `in-progress`, `blocked`, `priority-high`, etc.

Label setup (one-time, for maintainers): see [`tasks/README.md`](tasks/README.md).

#### Status on the wiki

GitHub only has **open** vs **closed**. The wiki maps that plus labels and comments:

| On GitHub | Wiki shows |
|-----------|------------|
| Issue **closed** | Done |
| Open + `blocked` label | Blocked |
| Open + `in-progress` label | In progress |
| Open + **at least one comment** | In progress |
| Open, no comments, no status labels | Not started |

Comment on an issue when work starts — no extra label required. Add `blocked` or `in-progress` labels if you want to override that logic.

Meeting metadata and label names live in [`tasks/config.json`](tasks/config.json). Legacy pre-Issues catalog: [`tasks/tasks-archive.json`](tasks/tasks-archive.json).

---

## Repo layout

```
isv-ai-wiki/
├── tasks/
│   ├── config.json                   # GitHub repo + meeting labels for Issues UI
│   ├── tasks-archive.json            # Legacy catalog (pre-Issues migration)
│   └── README.md                     # Labels setup + workflow
├── tasks.html                        # Redirects to index.html#tasks
├── css/isv-tasks.css                 # Follow-up panels + task table styles
├── js/isv-tasks.js                   # Loads GitHub Issues API + config
├── js/isv-theme.js                   # Theme toggle (default light, localStorage)
├── index.html                          # Wiki shell + navigation
├── preview.sh                          # Local server (port 8765)
├── tech-comm-*-*.html                  # Meeting note pages
├── stonehenge-microgrid-topology.html  # Open Energy Hackathon concept (Apr 2025)
├── technical-notes/
│   ├── catalog.json                    # Technical reports index
│   ├── sync-catalog.py                 # Sync from openami-smart-village GitHub
│   └── diagrams/                       # SVG diagrams for meeting notes
├── js/                                 # Funded projects map embed
└── .github/workflows/deploy.yml        # Deploy to GitHub Pages on push
```

---

## Open source & hosting

This wiki is **fully open source** and hosted for free on **GitHub Pages**.

| | |
|--|--|
| **Repository** | [github.com/overview-solutions/isv-ai-wiki](https://github.com/overview-solutions/isv-ai-wiki) |
| **Live site** | [overview-solutions.github.io/isv-ai-wiki](https://overview-solutions.github.io/isv-ai-wiki) |
| **License** | MIT ([LICENSE](LICENSE)) |
| **Tasks / follow-ups** | [GitHub Issues](https://github.com/overview-solutions/isv-ai-wiki/issues) on the same repo |
| **Deploy** | Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) publishes static files |

There is **no server to maintain** for the wiki itself: content is HTML, CSS, and JSON in git. GitHub builds and serves the site with HTTPS. Mapbox token (optional) is the only deploy secret — for the funded-projects map embed.

**Contribute content:** fork or branch → edit files → open a pull request. Meeting notes, catalog entries, and task labels/issues all live in this repository.

**Write access (collaborator):** Anyone can fork and open PRs without being added to the repo. To be added as a **GitHub collaborator** (push directly, manage issues with full repo access), email **Adam Sauer**, Tech Comm Committee Chair, at [adam.r.sauer@ieee.org](mailto:adam.r.sauer@ieee.org).

**Contribute code:** same flow. Local preview: `./preview.sh` (do not open `index.html` via `file://` — Tasks and other pages need HTTP).

First-time Pages setup (maintainers): repo **Settings → Pages → Source: GitHub Actions**.

---

## Deploy

Push to `main`. The workflow publishes to GitHub Pages automatically (~1 minute).

Site URL: `https://overview-solutions.github.io/isv-ai-wiki`

---

## Optional

**AI editing** — sidebar status dot → paste an [Anthropic API key](https://console.anthropic.com) → **Edit with AI** on any section. Key stays in your browser only.

**Mapbox** — embedded funded-projects map needs `MAPBOX_PUBLIC_TOKEN` as a GitHub Actions secret (see `deploy.yml`). Without it, the map shows a setup message.

---

## Contributing

Pull requests welcome for wiki content (meeting notes, catalog entries, etc.).

**Meeting follow-ups** go through **GitHub Issues**, not PRs to a task file:

- [Open a new follow-up](https://github.com/overview-solutions/isv-ai-wiki/issues/new?template=follow-up)
- [View all issues](https://github.com/overview-solutions/isv-ai-wiki/issues)
- [Wiki task board](https://overview-solutions.github.io/isv-ai-wiki/index.html#tasks) for a filtered summary

You need a GitHub account. Anyone can comment on public issues; to push to the repo or be assigned as a collaborator, email Tech Comm Chair **Adam Sauer** at [adam.r.sauer@ieee.org](mailto:adam.r.sauer@ieee.org). Sign up as an ISV volunteer at [smartvillage.ieee.org/volunteer](https://smartvillage.ieee.org/volunteer/) if you are not on the team yet.

MIT · IEEE Smart Village · Overview Solutions LLC
