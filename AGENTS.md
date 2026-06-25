# AGENTS.md — Navigation guide for AI assistants

This file is the **machine-oriented map** for the [ISV Knowledge Base](https://overview-solutions.github.io/isv-ai-wiki). Humans can read it too; [`README.md`](README.md) covers clone, preview, and deploy.

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
├── index.html                    # Shell: sidebar, sections, hash routing, registries
├── AGENTS.md                     # ← You are here (AI navigation)
├── README.md                     # Human quickstart
├── meter-vendor-study.html       # Cited vendor benchmark (standalone + embed)
├── meter-problems-today.html     # Utility AMI vs village stack diagrams
├── meter-vmrs.html               # OBIS VMRS + manufacturer POC playbook
├── meter-benchmark/
│   ├── vmrs-registers.json       # Machine-readable VMRS register set v0.1
│   └── northbound-mqtt-v0.1.json # Northbound JSON/MQTT profile + SIP hooks
├── tech-comm-*-*.html            # Meeting note pages (?embed=1 in iframe)
├── power-africa-*-*.html         # Workshop / event planning notes
├── stonehenge-microgrid-topology.html
├── technical-notes/
│   ├── catalog.json              # Report enrichments + wiki-only entries (ISV context)
│   ├── sync-catalog.py           # Optional: refresh catalog.json stubs from Dev Labs index
│   └── diagrams/                 # SVG for meeting notes (e.g. metering-topology.svg)
├── js/                           # Funded projects map (Mapbox)
└── .github/workflows/deploy.yml  # GitHub Pages
```

**Live base URL:** `https://overview-solutions.github.io/isv-ai-wiki/`

**Local preview:** `./preview.sh` → `http://localhost:8765/index.html`

---

## How navigation works

### Single-page app shell

`index.html` hides/shows `<div class="section" id="sec-{name}">` blocks. Sidebar calls `showSection(id)`.

Registered sections (`SECTIONS` in `index.html`):

| `home` · `mission` · `funded` · `notes` · `tasks` · `committees` · `power-africa` · `meter-study` · `tech-notes` · `standards` · `data` · `resources`

`home` is the IEEE Smart Village Knowledge Base **and** the Tech Committee working hub (intro blocks + initiatives). Legacy `#tech` hash redirects to `home`. Other ISV committees (RWGs, subcommittees) live on `committees`.

### Hash URLs (stable deep links)

| Hash | Lands on |
|------|----------|
| `#home` | Landing page — Knowledge Base intro + Tech Comm hub (default) |
| `#committees` | Other ISV committees — RWGs and subcommittees |
| `#tasks` | GitHub Issues — live list from `overview-solutions/isv-ai-wiki` |
| `#tasks?meeting=metering-2026-05-28` | Filter by meeting label |
| `#meter-study` | Meter benchmark — default: vendor study |
| `#meter-study/problems-today` | Utility AMI vs village minimum stack |
| `#meter-study/vmrs` | OBIS VMRS + northbound profile |
| `#meter-study/vendor-study` | Vendor pipeline + technical tables |
| `#notes/{note-id}` | Tech Comm meeting note (default: `metering-2026-05-28`) |
| `#power-africa/{note-id}` | Workshop planning (default: `power-africa-2026-workshop-planning`) |
| `#tech-reports` | Technical reports list |
| `#tech-reports/{pub-id}` | Single report detail (from `catalog.json`) |
| `#tech-notes/...` | Legacy alias → still works |
| `#mission`, `#funded`, `#committees`, `#home`, … | Top-level sections (`#tech` → redirects to `#home`) |

**For agents:** Prefer hash links when citing wiki pages. Prefer **standalone HTML** (`meter-vendor-study.html`) when scraping full content — iframes omit chrome but duplicate body.

### Embed pattern

Standalone pages accept `?embed=1` to hide back-navigation chrome (`html.embed` class). The shell loads:

- `meter-vendor-study.html?embed=1`
- `meter-problems-today.html?embed=1` · `meter-vmrs.html?embed=1`
- `MEETING_NOTES[noteId].src` (also `?embed=1`)

When **creating** a new note page, copy an existing `tech-comm-*.html`, keep the embed script, and register in `MEETING_NOTES`.

### Registries in `index.html` (edit these when adding content)

| Constant | Purpose |
|----------|---------|
| `SECTIONS` | Top-level nav ids |
| `MEETING_NOTES` | Note id → `{ group, title, date, src, standalone }` |
| `METER_BENCHMARK_PAGES` | Page id → `{ title, sub, src, standalone }` for meter-study sub-nav |
| `NOTE_GROUPS` | `tech-comm` → `notes` section; `power-africa` → `power-africa` section |
| `TECH_NOTES_CATALOG_URL` | Points to `technical-notes/catalog.json` |

---

## Content types and trust hierarchy

Read sources in this order when answering technical questions:

1. **Cited benchmark tables** — [`meter-vendor-study.html`](meter-vendor-study.html) (numbered `[s1]`… bibliography).
2. **Tech Comm meeting notes** — problem framing, topology, action items (e.g. [`tech-comm-2026-05-28-metering-topology.html`](tech-comm-2026-05-28-metering-topology.html)).
3. **Technical reports** — list built live from openami-smart-village `reports/index.html`; enrichments in `catalog.json` (`isvRelevance`, `relatedMeetingNotes`). Full docs on [Cottonspace](https://sattal.cottonspace.com/reports).
4. **Standards section** in `index.html` — quick reference (DLMS, STS, SunSpec, IEEE 2030.5).
5. **ISV-internal** — DokuWiki PDFs, prior outreach contacts. Tag as **ISV**, not independent verification.
6. **Legacy DokuWiki** — `http://34.125.138.210/...` (migration source; may be stale).

**Never** upgrade `claim` → `doc` or `—` → a vendor feature without a new citation. **Never** invent unit pricing; use industry bands or mark unknown.

---

## Meter benchmark — what matters most

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
| **IEEE 2030.5** | Grid-facing DER gateways and utility programs — rarely the village prepaid meter. |
| **Modbus RTU/TCP** | EMS, hybrid inverters, Stellar Edge — generation and control, not STS token paths. |
| **SIP (Session Information Protocol)** | Glenn Algie / Tech Comm — authenticated sessions for theft-resistant DER markets; hooks in northbound MQTT v0.1, not SunSpec/VoIP SIP. |

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

Open [`#meter-study`](index.html#meter-study) or `meter-vendor-study.html`:

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
8. **Prefer** updating existing study tables over spawning duplicate markdown vendor lists.

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

## Related repos and upstream

| Resource | URL |
|----------|-----|
| This wiki (GitHub) | `https://github.com/overview-solutions/isv-ai-wiki` |
| Dev Labs reports source | `https://github.com/rahulbhargavain/openami-smart-village` |
| Funded projects map data | `https://github.com/overview-solutions/RemoteMonitorMap` |
| Legacy DokuWiki | `http://34.125.138.210/` |
| OpenAMI / IEEE ISV context | See `catalog.json` items tagged `OpenAMI` |

---

## Changelog convention

When making substantial benchmark or navigation changes, add a one-line note at the top of `meter-vendor-study.html` subtitle or in the PR description: **date · what changed · what was not verified**.

This `AGENTS.md` should be updated when: new top-level sections are added, hash routing changes, or the benchmark framework gains new mandatory columns.
