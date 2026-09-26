# AGENTS.md — Navigation guide for AI assistants

This file is the **machine-oriented map** for the [ISV Knowledge Base](https://isv.wiki/). Humans can read it too; [`README.md`](README.md) covers clone, preview, and deploy.

---

## Why this wiki exists

IEEE Smart Village (ISV) funds village-scale energy programs across Africa and Asia. Field NGOs repeatedly hit the same engineering wall:

- **Metering capex** can rival or exceed generation hardware on small mini-grids.
- **Revenue collection** fails without per-customer visibility (theft, bypass, flat tariffs).
- **Protocol fragmentation** — STS prepaid tokens, DLMS/COSEM utility AMI, Modbus at the inverter, proprietary OEM mesh stacks — makes swap and scale painful.
- **Rural backhaul** and DCU reliability break cloud-first designs.

The legacy DokuWiki captured vendor names and outreach status but not **comparable, cited technical benchmarks**. This repo is a **static, GitHub-hosted knowledge base** that:

1. Preserves **Tech Comm reasoning** (meeting notes, topology diagrams).
2. Indexes **external research** (Dev Labs / Cottonspace reports) without duplicating them.
3. Hosts **living comparison artifacts** (meter vendor study, vendor contacts).
4. Stays **editable by volunteers and AI** with no build step — push HTML/JSON, Pages deploys.

### What we optimize for

| Priority | Meaning |
|----------|---------|
| **Decision support, not marketing** | Help a team shortlist meters/platforms with evidence, not sell a vendor. |
| **Honest unknowns** | Empty cells and “dead ends” are features. Never fill gaps from memory. |
| **Layer-correct comparisons** | Score DLMS at the meter/DCU row, not the cloud row. Don’t compare revenue meters to generation monitors without saying so. |
| **Citations** | Vendor pages, PDFs, and independent industry reports get numbered refs. ISV-internal notes are tagged separately. |
| **Low friction maintenance** | One HTML file per note/study; register in `index.html`; push to `main`. |
| **Interop across AI sessions** | Stable paths, hash URLs, and this file so the next agent doesn’t re-discover structure. |

We are **not** optimizing for: exhaustive vendor databases, real-time pricing, certified test lab results, or replacing utility procurement RFPs.

---

## Repository layout (read this first)

```
isv-ai-wiki/
├── index.html                    # Shell: sidebar, sections, hash routing, registries, WebMCP tools
├── AGENTS.md                     # ← You are here (AI navigation)
├── auth.md                       # Public site auth notes (no OAuth on this host)
├── llms.txt                      # Concise agent URL index
├── robots.txt                    # Content-Signal + Agentmap → ai-catalog
├── README.md                     # Human quickstart
├── .well-known/
│   ├── ai-catalog.json           # ARD capability manifest
│   ├── agent-skills/             # Skills discovery index + SKILL.md files
│   ├── api-catalog               # RFC 9727 linkset
│   └── agents/index.json         # DNS-AID HTTP index (no live MCP/A2A)
├── meter-overview.html           # Village Metering — context, hardware threads (default embed)
├── meter-roadmap.html            # Three-phase development roadmap (+ ThunderCloud Phase 1 note)
├── meter-problems-today.html     # Field problems → solutions
├── meter-solutions-map.html      # Visual problem ↔ stack map (SteamaCo · SparkMeter · EnAccess · OpenAMI)
├── meter-village-scope.html      # Village definition · population · HDI (cited)
├── meter-vendor-study.html       # Cited vendor benchmark (standalone + embed)
├── village-simulator/            # v1 frozen / offline snapshot (do not develop; not the primary embed)
│   └── index.html                # Three/Locus-era snapshot — one link from hub
├── meter-village-simulator.html  # Sim hub: nested iframe = live Pages sim
├── meter-village-geojson-un.html # Open Esri UN–style GeoJSON village pack (essential / nice-to-have)
├── meter-benchmark/
│   ├── vmrs-registers.json       # Machine-readable VMRS register set v0.1
│   └── northbound-mqtt-v0.1.json # Northbound JSON/MQTT profile + IETF SIP (RFC 3261) dialog correlation
├── power-africa-2026-workshop-planning.html # OpenAMI EMS Workshop results (Nairobi · 4 sessions ran · 21 + 24 Sep)
├── oms-workshop-nairobi-2026.html           # OMS Workshop Nairobi (A2EI · EnAccess · 30 Sep–2 Oct)
├── oms-training-skills.html                 # Training-task catalog (OMS pre-session + EMS workshop ask · modules TBD)
├── power-africa-2026-conference.html        # IEEE PES & IAS Power Africa Conference 2026 links
├── power-africa-openami-presentation-2025.html  # OpenAMI deck @ PowerAfrica Sep 2025
├── open-energy-hackathon-2025.html  # 2025 Open Energy Hackathon summary (Circles of Power)
├── open-energy-hackathon-2026.html  # 2026 hackathon planning (Earth Day · SF Climate Week · Port Labs)
├── oseas-2026.html                  # OSEAS 2026 Kigali planning
├── wireless-telecom.html            # Leaf / NAN / WAN radio map (LoRaWAN, TVWS, LTE, Starlink, …)
├── stonehenge-microgrid-topology.html
├── technical-notes/
│   ├── catalog.json              # Report enrichments + wiki-only entries (ISV context)
│   ├── AGENT-READINESS-CLOUDFLARE.md  # isitagentready checklist vs honest capabilities
│   ├── sync-catalog.py           # Optional: refresh catalog.json stubs from Dev Labs index
│   └── diagrams/                 # SVG for meeting notes (e.g. metering-topology.svg)
├── js/                           # Funded projects map (Mapbox)
└── .github/workflows/deploy.yml  # GitHub Pages
```

**Live base URL:** `https://isv.wiki/` (GitHub Pages mirror: `https://overview-solutions.github.io/isv-ai-wiki/`)

### Agent discovery (machine entrypoints)

| Path | Role |
|------|------|
| `/AGENTS.md` | This map |
| `/llms.txt` | Short URL index |
| `/auth.md` | Public site — **no OAuth / no registration** on this host |
| `/.well-known/ai-catalog.json` | ARD capability manifest |
| `/.well-known/agent-skills/index.json` | Skills: navigate, cite-evidence, village-map-twin |
| `/.well-known/api-catalog` | RFC 9727 linkset |
| `/.well-known/agents/index.json` | DNS-AID HTTP index (empty live agents) |

**Not published (would lie):** OAuth/OIDC discovery, OAuth protected-resource metadata, MCP server card — no auth server and no MCP on this host. See `technical-notes/AGENT-READINESS-CLOUDFLARE.md`.

**Markdown `Accept: text/markdown` negotiation:** Cloudflare zone toggle only (Pile B), not a static-file feature.
**Map CSP:** Cloudflare Transform Rule `isv-wiki-security-headers` must allow Mapbox GL. Embed uses `mapbox-gl-csp.js` + `mapbox-gl-csp-worker.js` because `blob:` workers are blocked. Keep `script-src` / `connect-src` including `https://api.mapbox.com`. Project GeoJSON must come from `raw.githubusercontent.com` (github.io is not in `connect-src`). **`frame-src` today is `'self' https://player.vimeo.com https://docs.google.com`.** Cutover: hub nested iframe dest is `https://overview-solutions.github.io/smart-village-simulator/?embed=1`. **Must add `https://overview-solutions.github.io` to `frame-src`** on that Transform Rule or Chrome blocks (“This content is blocked”). Circaevum Locus (`https://circaevum.github.io`) still not on the list. Dashboard change; not this repo. v1 freeze stays on disk at `village-simulator/` (link only).

**Local preview (offline kit):** `./preview.sh` → `http://127.0.0.1:8765/index.html`  
Hub at `#village-metering/village-simulator` iframes github.io (needs net + CSP). Offline v1: `village-simulator/index.html` — **no** second repo. Local/dev live app: sibling [`smart-village-simulator`](https://github.com/overview-solutions/smart-village-simulator) → `npm start` (:5176). See README → *Offline in one go*.

---

## Public / private split (read before committing)

This repo (`isv-ai-wiki`) is **public**. A second repo, **`overview-solutions/isv-ai-wiki-private`**, holds material that must not be on the open web. The governance rules are in [`SHARING-POLICY.md`](SHARING-POLICY.md) (human-facing, also public). This section is the machine-oriented version.

### The boundary is one-directional

Private context may *inform* public writing in the abstract, but **no private fact, name, direct contact, price, or NDA-quoted text is ever written into a file in this public repo.** When both repos are open in the same editor (see Cursor workflow below), treat `isv-ai-wiki-private/` as **read-only context, never a copy source** for public files.

### What is private (never commit to `isv-ai-wiki`)

| Category | Examples |
|----------|----------|
| **Outreach contacts & status** | Named individuals, personal/direct emails, WeChat/WhatsApp, "who replied / who intro'd / negotiation state". *Exception:* a vendor's own **published generic** address (`info@`, `sales@`) is public. |
| **Unpublished pricing / terms** | Real quoted `$/connection`, discounts, NDA pricing. Public study uses **industry bands** only ($40–110 cited). |
| **NDA-gated technical docs** | DLMS interop guides, ICDs, restricted datasheets. Public wiki may *name* the doc and cite it as ISV-internal; never host or quote restricted contents. |
| **Internal people / partner details** | Personal contact info, partner internal notes, unconsented individuals. Self-published staff contact (e.g. chair's IEEE email) is exempt. |

### When a note mixes public and private

Split it. Public reasoning stays here; private specifics go to `isv-ai-wiki-private`; the public file links across as **"ISV-internal — access on request."** Never inline the private part "just for now."

### Cursor / AI shared-context workflow

The intended editing setup loads **both** repos as siblings so an assistant has full context while respecting the boundary:

```
ISV/                       ← parent folder (open this in Cursor, or use the workspace file)
├── isv-ai-wiki/           ← PUBLIC — this repo
└── isv-ai-wiki-private/      ← PRIVATE — clone beside it, never published
```

- Open [`isv-wiki.code-workspace`](isv-wiki.code-workspace) in Cursor/VS Code for a ready multi-root view of both repos. (Harmless if the private folder isn't cloned yet — it shows empty.)
- The private repo carries its **own** `AGENTS.md` describing its contents; read both.
- **Commit discipline:** every change destined for `isv-ai-wiki` must pass the categories table above. Before you stage a public commit, scan the diff for emails of named individuals, real prices, and NDA text. When unsure, it is private.
- The reverse is fine: pulling a *public* citation or band *into* a private working doc is allowed.

### Trust hierarchy note

In the trust hierarchy below, **ISV-internal** sources (item 5) now live in `isv-ai-wiki-private`, not inline in public files. Cite them as ISV-internal; do not paste their restricted contents here.

---

## How navigation works

### Single-page app shell

`index.html` hides/shows `<div class="section" id="sec-{name}">` blocks. Sidebar calls `showSection(id)`.

Registered sections (`SECTIONS` in `index.html`):

| `home` · `about` · `supported` · `notes` · `tasks` · `events` · `village-metering` · `tech-notes` · `standards` · `data` · `resources`

`home` is the Tech Committee working hub. `about` — mission and volunteer structure. `supported` — field-program map (legacy `#funded` → `supported`). Official ISV site: https://smartvillage.ieee.org/

### Hash URLs (stable deep links)

| Hash | Lands on |
|------|----------|
| `#home` | Landing page — Knowledge Base intro + Tech Comm hub (default) |
| `#about` | Mission, volunteer structure |
| `#supported` | Field-program map (Tech Comm support on request) |
| `#mission`, `#committees` | Legacy — scroll to anchors on `#about` |
| `#funded`, `#field-programs` | Legacy — opens `#supported` |
| `#tasks` | GitHub Issues — live list from `overview-solutions/isv-ai-wiki` |
| `#tasks?meeting=metering-2026-05-28` | Filter by meeting label |
| `#village-metering` | Village Metering — default: overview |
| `#village-metering/overview` | Why ISV · gateway path · hardware threads (section entry) |
| `#village-metering/roadmap` | Three-phase development roadmap (installed-base · microgrid core · grid connect) |
| `#village-metering/tc20-review` | TC 2.0 technical report · GroundBolt HES · data objects |
| `#village-metering/village-scope` | Village definition · population · HDI · modernization fork (cited) |
| `#village-metering/problems` | Field problems (Problem · Why it hurts) |
| `#village-metering/solutions-map` | Visual problem ↔ stack diagram (SteamaCo · SparkMeter · EnAccess · OpenAMI) · `meter-benchmark/problem-solution-map.json` |
| `#village-metering/vmrs` | Register checklist (OBIS · VMRS) · IDIS companion-profile note |
| `#village-metering/vendor-study` | Vendor pipeline + technical tables |
| `#village-metering/openami` | OpenAMI stack · leakage visibility |
| `#village-metering/meshems` | MeshEMS board |
| `#village-metering/village-simulator` | Village Simulator hub (`meter-village-simulator.html`): nested iframe = live Pages `https://overview-solutions.github.io/smart-village-simulator/?embed=1`. **Requires** Cloudflare `frame-src` include `https://overview-solutions.github.io` or Chrome blocks. v1 frozen snapshot: `village-simulator/` (one link, not a second stage). Local `npm start` (:5176). Legacy `#village-metering/worldline-day` aliases here. |
| `#village-metering/village-geojson-un` | Open Utility Network GeoJSON pack: essential vs nice-to-have layers, joins, LOD, API bindings. Starter from `smart-village-simulator/villages`. |
| `#meter-study/...` | Legacy — same as `#village-metering/...` (`problems-today` → `problems`, `scope` → `village-scope`) |
| `#notes/{note-id}` | Tech Comm meeting note (default: `metering-2026-05-28`) |
| `#events/{note-id}` | In-person events (workshops, hackathons; default: `open-energy-hackathon-2025`). Legacy `#power-africa/...` still resolves. |
| `#events/power-africa-2026-workshop-planning` | OpenAMI EMS Workshop **results** (filename kept). All 4 sessions ran (3 Mon + 1 Thu). BUILD sim · Open Utility Network convention · PCB interest sheet / handwritten handout TBD. |
| `#events/oms-workshop-nairobi-2026` | OMS Workshop Nairobi · 30 Sep–2 Oct 2026 · A2EI · EnAccess · draft agenda + online pre-session votes. Attendance not published. |
| `#events/oms-training-skills` | Training-task catalog — village energy + OMS / metering skillsets across the lifecycle. Not a course. Demand from OMS pre-session + OpenAMI EMS workshop training ask. Modules TBD. |
| `#tech-reports` | Technical reports list |
| `#tech-reports/{pub-id}` | Single report detail (from `catalog.json`) |
| `#tech-notes/...` | Legacy alias → still works |
| `#standards` | Standards list — village relevant vs larger grid integration |
| `#standards-village` | Village-relevant standards (2030.10, DLMS, OBIS, SunSpec, …) |
| `#standards-grid` | Larger-grid integration (1547, 2030.5, OpenADR, 2800, P4200, …) |
| `#mission`, `#funded`, `#committees`, `#home`, … | Top-level sections (`#tech` → `#home`; `#funded` → `#supported`) |

**For agents:** Prefer hash links when citing wiki pages. Prefer **standalone HTML** (`meter-vendor-study.html`) when scraping full content — iframes omit chrome but duplicate body.

### Embed pattern

Standalone pages accept `?embed=1` to hide back-navigation chrome (`html.embed` class). The shell loads:

- `meter-overview.html?embed=1` (default)
- `meter-problems-today.html?embed=1` · `meter-village-scope.html?embed=1` · `meter-vmrs.html?embed=1` · `meter-vendor-study.html?embed=1`
- `MEETING_NOTES[noteId].src` (also `?embed=1`)
- `#village-metering/village-simulator` → iframe `meter-village-simulator.html?embed=1` (hub). Nested iframe dest = live Pages `https://overview-solutions.github.io/smart-village-simulator/?embed=1` (cutover done). Cloudflare Transform Rule `isv-wiki-security-headers` **must** add `https://overview-solutions.github.io` to `frame-src` or Chrome: “This content is blocked”. v1: `village-simulator/index.html` (link only).

When **creating** a new note page, copy an existing `tech-comm-*.html`, keep the embed script, and register in `MEETING_NOTES`.

The village-metering iframe guard must detect the wiki shell by DOM (`#meter-study-frame`), never by `/index.html$`. That regex also matches `village-simulator/index.html` and reload-loops the sim.

### Registries in `index.html` (edit these when adding content)

| Constant | Purpose |
|----------|---------|
| `SECTIONS` | Top-level nav ids |
| `MEETING_NOTES` | Note id → `{ group, title, date, src, standalone }` |
| `METER_BENCHMARK_PAGES` | Page id → `{ title, sub, src, standalone }` for village-metering sub-nav |
| `NOTE_GROUPS` | `tech-comm` → `notes` section; `events` → `events` section (in-person workshops & hackathons) |
| `TECH_NOTES_CATALOG_URL` | Points to `technical-notes/catalog.json` |

---

## Content types and trust hierarchy

Read sources in this order when answering technical questions:

1. **Cited benchmark tables** — [`meter-vendor-study.html`](meter-vendor-study.html) (numbered `[s1]`… bibliography).
2. **Tech Comm meeting notes** — problem framing, topology, action items (e.g. [`tech-comm-2026-05-28-metering-topology.html`](tech-comm-2026-05-28-metering-topology.html)).
3. **Technical reports** — list built live from openami-smart-village `reports/index.html`; enrichments in `catalog.json` (`isvRelevance`, `relatedMeetingNotes`, **provenance**: `sourceKind`, `authorship`, `reviewStatus`). Full docs on [Cottonspace](https://sattal.cottonspace.com/reports) or external PDFs. Defaults: Dev Labs → AI-assisted draft; ISV wiki → human reviewed; external → index-only.
4. **Standards section** in `index.html` — split **village relevant** (`#standards-village`: 2030.10, 2030.7, DLMS, OBIS, RS-485, SunSpec, OpenAMI GeoJSON) vs **larger grid integration** (`#standards-grid`: 1547, 2030.5, OpenADR, 2800, P4200, TLS, grid cybersecurity, Esri UN). Do not score DLMS at the transmission-IBR row.
5. **ISV-internal** — DokuWiki PDFs, prior outreach contacts. Tag as **ISV**, not independent verification.
6. **Legacy DokuWiki** — `http://34.125.138.210/...` (migration source; may be stale).

**Never** upgrade `claim` → `doc` or `—` → a vendor feature without a new citation. **Never** invent unit pricing; use industry bands or mark unknown.

---

## Metering focus — what matters most

The study uses a **three-layer stack** (field / edge / cloud). The most **versatile** columns across use cases:

### Tier 1 — Ask these first (any village mini-grid operator)

| Benchmark | Why it matters |
|-----------|----------------|
| **STS support** (`doc` / `claim` / `—`) | Prepaid token vending is the dominant rural billing model in SSA. Drives CIU, vending integration, key management. |
| **VMRS / OBIS export** (`doc` / `claim` / `—`) | **Draft** ISV shortlist in `meter-benchmark/vmrs-registers.json` — tier A/B/C certainty; not a published standard. Validate per vendor ICD. |
| **DLMS/COSEM** at meter + DCU | Utility-grade interoperability, future HES/MDMS, avoids permanent OEM lock-in if documented. |
| **Northbound API / platform** | How billing, CRM, and mobile money connect. “REST (partner login)” ≠ public OpenAPI. |
| **$/connection band** | Capex gate; compare industry ranges ($40–110 installed cited in study) — not list prices unless sourced. |
| **Vendor contacts** | Actionable follow-up; form-only vendors need human outreach. |

### Tier 2 — Stack role and lock-in

| Benchmark | Why it matters |
|-----------|----------------|
| **Full-stack vs meter-only vs platform-only** | SteamaCo/SparkMeter/Okra are systems; Donsun/Inhemeter/Calin are hardware; NSR is edge OS. |
| **NAN / WAN transport** | RF mesh, PLC, GPRS, LTE — drives opex, theft surface, and who owns the DCU. |
| **Lock-in** (`partner` / `closed` / `agnostic`) | Migration cost if the startup outgrows the vendor. |
| **Confidence T0–T3** | T1 datasheet ≠ T3 field-tested on your feeder voltage. |

### Tier 3 — Layer-specific (don’t mis-apply)

| Benchmark | When it applies |
|-----------|-----------------|
| **SunSpec** | Inverter / DER monitoring (Victron, Enphase), not cheap STS keypad meters. |
| **IEEE 2030.5** | Phase 3 — grid-facing DER gateways and utility programs — rarely the village prepaid meter. |
| **OpenADR** | Phase 3 — utility/aggregator demand-response price/events (VTN/VEN); deferred until grid/aggregator counterpart exists. |
| **Modbus RTU/TCP** | Phase 1–2 — EMS, hybrid inverters, Stellar Edge, DIN meters — generation/feeder and control, not STS token paths. |
| **SIP (Session Initiation Protocol)** | IETF RFC 3261 — optional Phase 3 control-plane dialogs; OpenAMI MQTT may correlate via `sipCallId`. Not a register map. |

### Northbound profile location

**Canonical home:** `meter-benchmark/northbound-mqtt-v0.1.json` (with companion `vmrs-registers.json`). Version with the wiki via Git; human docs on `meter-vmrs.html` and `meter-problems-today.html`.

### Scoring legend (do not reinterpret)

- **Protocol cell:** `doc` · `claim` · `no` · `—` · `N/A`
- **Pipeline:** outreach / brochure / pricing pills are operational, not technical proof
- **Dead ends section** — explicit research failures; preserve when updating

---

## Playbook: new microgrid startup

A team deploying its **first** 50–500 connection village grid can use this wiki in ~30 minutes:

### 1. Frame the problem (10 min)

- Read **Home → Mission** pain bullets (metering cost, theft, protocols).
- Open **Meeting note:** `#notes/metering-2026-05-28` — feeder topology, where meters sit vs generation CTs.
- Skim **Technical reports** tagged `OpenAMI`, `metering`, `STS` in `catalog.json`.

### 2. Choose architecture class (5 min)

Answer: *Do we need utility-style AMI, prepaid STS only, or a proprietary mesh platform?*

| If you need… | Start with vendors in study… |
|--------------|------------------------------|
| Lowest capex prepaid, own vending | Donsun, Calin, Inhemeter, Mojec (STS + often DLMS) |
| Turnkey billing + mesh, accept lock-in | SparkMeter, SteamaCo, Okra (Harvest) |
| Meter-agnostic microgrid OS | New Sun Road (Modbus edge; not a revenue meter) |
| Generation monitoring only | Victron, Enphase, Deye, Fronius rows |

### 3. Shortlist with the benchmark (10 min)

Open [`#village-metering`](index.html#village-metering) or `meter-vendor-study.html`:

1. **Vendor contacts** — email two meter OEMs + one platform if relevant.
2. **Technical benchmark — meters** — filter `STS doc` + `DLMS doc`.
3. **Industry cost bands** — sanity-check BOM against $40–110/connection literature (not gospel).
4. **Bibliography** — pull datasheets from `[s#]` links for your own procurement doc.

### 4. Operational next steps (outside wiki)

- Request **STS key management** and **vending** path (own HES vs vendor cloud).
- Ask for **DLMS interoperability guide** (Inhemeter and others may be NDA-gated).
- Pilot **one feeder** before fleet DCU commit — rural backhaul kills many AMI business cases.
- Cross-check **local regulation** (e.g. EMG-REG-008 Nigeria report in catalog).

### What startups should not expect from this wiki

- Certified compatibility guarantees
- Live pricing or lead times
- Legal/regulatory sign-off in your country
- Replacement for installer field tests at your site voltage and harmonic profile

---

## AI contributor rules

When editing this repo:

1. **Read** `meter-vendor-study.html` method box and bibliography before adding vendor claims.
2. **Add citations** — new `[s#]` row in bibliography; tag `V` / `I` / `ISV`.
3. **Register** new meeting notes in `MEETING_NOTES` + sidebar sub-nav if needed.
4. **Use embed pattern** — `?embed=1` + `html.embed` CSS on standalone pages.
5. **Report enrichments** — edit `technical-notes/catalog.json` for `isvRelevance` / `relatedMeetingNotes`; optional `python3 technical-notes/sync-catalog.py` to refresh stubs (`syncProtected` entries preserved).
6. **Don't** edit `index.html` mission/standards prose unless the user asked — scope to the task.
7. **Don't** commit secrets (Mapbox tokens, API keys). Map token is a GitHub Actions secret.
8. **Don't** commit private material — named contacts, real pricing, NDA docs, unconsented personal details. See *Public / private split* above and [`SHARING-POLICY.md`](SHARING-POLICY.md). Those belong in `isv-ai-wiki-private`.
9. **Prefer** updating existing study tables over spawning duplicate markdown vendor lists.

### Common tasks → files

| Task | File(s) |
|------|---------|
| Create / update follow-up | [GitHub Issues](https://github.com/overview-solutions/isv-ai-wiki/issues) — use **Follow-up task** template; add meeting label |
| Meeting metadata for tasks UI | `tasks/config.json` |
| Legacy task catalog (archive) | `tasks/tasks-archive.json` |
| Add vendor row / contact | `meter-vendor-study.html` |
| New Tech Comm note | `tech-comm-YYYY-MM-DD-topic.html`, `index.html` → `MEETING_NOTES` |
| Workshop / event plan | `power-africa-*.html`, `NOTE_GROUPS` / `MEETING_NOTES` |
| Index external report | `technical-notes/catalog.json` |
| Update topology diagram | `technical-notes/diagrams/metering-topology.svg`, `EDITING.md` |
| Deploy | Push to `main` — `.github/workflows/deploy.yml` |

---

## In-person events & workshops

### Power Africa Conference 2026 — OpenAMI EMS Workshop (results)

- **What ran:** all **4 sessions** — **3 Monday 21 Sep** (Ivory Room) + **1 Thursday 24 Sep** (14:00–15:30 wrap-up).
- **Time zone:** Nairobi, Kenya (`EAT · UTC+3`)
- **Venue:** Safari Park Hotel, Ivory Room
- **Instructors:** Glenn Algie, Adam Sauer, Aaron Tushabe, Jude Numfor
- **Sessions:** (1) Stranded Legacy Updates 11:05–13:00 · (2) Next Gen 14:00–16:00 · (3) Business Case and Code Challenges 16:15–17:50 · (4) Thursday wrap-up.
- **Simulator:** BUILD mode — developers construct the microgrid; data auto-formats to **Open Utility Network convention** (not a standard). **LOADS** and **GENERATION** (Energy Assets). Main view **OPERATIONS** / **MAINTENANCE**.
- **PCB follow-up:** interest sheet + form on the results page. Handwritten handout list TBD. Name list from sheet pending (no public CSV without login).
- **Photos:** conference page (`power-africa-2026-conference.html`), not the workshop page.
- **Standalone page:** `power-africa-2026-workshop-planning.html` (filename kept; embeds at `#events/power-africa-2026-workshop-planning`).

### OMS Workshop Nairobi — 30 Sep–2 Oct 2026

- **Hosts:** A2EI and EnAccess. Draft agenda in prep pack (may change).
- **Online pre-session:** Tue 22 Sep 2026, 11:00–12:30 CEST · AMDA / A2EI / EnAccess · 50+ on the call (already ran).
- **In-person attendance:** not published on this wiki.
- **Standalone page:** `oms-workshop-nairobi-2026.html` · `#events/oms-workshop-nairobi-2026`.
- **Training-task catalog** (not a course): `oms-training-skills.html` · `#events/oms-training-skills` — work that needs training, mapped to lifecycle phases. Modules TBD. No date / venue / sign-up.

---

## Related repos and upstream

### Village Simulator and Locus

**Cutover (done):** hub nested iframe dest is the live Pages Vite app
`https://overview-solutions.github.io/smart-village-simulator/?embed=1`.
`METER_BENCHMARK_PAGES['village-simulator'].src` stays `meter-village-simulator.html`
(same-origin hub). Hashes `#village-metering/village-simulator`, `worldline-day`,
`worldline-day-100` still land on the hub. **Cloudflare Transform Rule
`isv-wiki-security-headers` must add `https://overview-solutions.github.io` to
`frame-src`** or Chrome blocks the nested iframe.

**v1 (frozen / offline snapshot):** `village-simulator/` stays on disk. One link
from the hub — not a second equal theater. Do not develop that tree. Offline:
`./preview.sh` then open `village-simulator/index.html` (no Node, no live repo).

Canonical source: [smart-village-simulator](https://github.com/overview-solutions/smart-village-simulator)
(local `ISV/smart-village-simulator/`, `npm start` → :5176). It consumes
`@circaevum/locus` (`time` + `geo` subpaths). Graphics library:
[Circaevum/locus](https://github.com/Circaevum/locus) (`CIR/yang/locus`).

Ownership: **Locus** = place/time graphics; **simulator** = energy behavior / UI;
**this wiki** = docs, nav, embed. MapLibre + OpenFreeMap is a Locus example, not
the wiki Mapbox funded-projects map.

The supported-projects map (`#supported`) is a static screenshot
(`assets/smart_village_map.png`, from RemoteMonitorMap `Img/`) linking out to
the live Pages map. Do not iframe `map-embed.html` there — the live map shows
all OSM power layers. Mapbox `js/` + `map-embed.html` stay for optional
standalone use. Separate from the simulator basemap; Mapbox is not in Locus.

| Resource | URL |
|----------|-----|
| This wiki (GitHub, **public**) | `https://github.com/overview-solutions/isv-ai-wiki` |
| Private companion repo (**access-controlled**) | `https://github.com/overview-solutions/isv-ai-wiki-private` — contacts, pricing, NDA docs; see [`SHARING-POLICY.md`](SHARING-POLICY.md) |
| Dev Labs reports source | `https://github.com/rahulbhargavain/openami-smart-village` |
| Funded projects map data | `https://github.com/overview-solutions/RemoteMonitorMap` |
| Legacy DokuWiki | `http://34.125.138.210/` |
| OpenAMI / IEEE ISV context | See `catalog.json` items tagged `OpenAMI` |

---

## Changelog convention

When making substantial benchmark or navigation changes, add a one-line note at the top of `meter-vendor-study.html` subtitle or in the PR description: **date · what changed · what was not verified**.

This `AGENTS.md` should be updated when: new top-level sections are added, hash routing changes, or the benchmark framework gains new mandatory columns.
