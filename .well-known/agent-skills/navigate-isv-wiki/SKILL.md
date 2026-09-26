---
name: navigate-isv-wiki
description: >
  Navigate the ISV Knowledge Base (isv.wiki): hash routes, Village Metering
  embeds, and which files agents should fetch first.
---

# Navigate isv.wiki

## Start here

1. Fetch `https://isv.wiki/AGENTS.md` (full map + trust rules).
2. Fetch `https://isv.wiki/llms.txt` (short index of key URLs).
3. Discovery JSON: `https://isv.wiki/.well-known/ai-catalog.json`.

## URL patterns

| Pattern | Meaning |
|---------|---------|
| `https://isv.wiki/` | SPA shell (`index.html`) |
| `#village-metering/{page}` | Metering embed pages |
| `#notes/{id}` | Meeting notes |
| `#events/{id}` | Event planning pages |
| Direct `*.html` / `*.json` / `*.md` | Prefer these for agents (no SPA needed) |

## Village Metering page ids

`overview` · `roadmap` · `problems` · `solutions-map` · `village-scope` · `vendor-study` · `openami` · `meshems` · `village-simulator` · `village-geojson-un`

Example: `https://isv.wiki/index.html#village-metering/village-geojson-un`

## Offline

Clone the repo and run `./preview.sh` → `http://127.0.0.1:8765/index.html`. Frozen Village Simulator ships inside the wiki (same-origin iframe). Live Vite app: `https://overview-solutions.github.io/smart-village-simulator/?embed=1` (new tab — isv.wiki cannot iframe github.io). Local/dev: sibling `smart-village-simulator` repo.
