---
name: cite-evidence
description: >
  Cite ISV wiki sources honestly: trust hierarchy, empty cells stay empty,
  never invent prices or lab results.
---

# Cite evidence from isv.wiki

## Trust hierarchy (high → low)

1. Numbered citations on wiki pages (vendor PDFs, standards, independent reports)
2. Machine JSON with provenance (`technical-notes/catalog.json`, VMRS, northbound MQTT)
3. Tech Comm meeting notes (ISV-internal context — label as such)
4. Unverified / empty cells — **leave empty**; say “not verified”

## Never

- Fill meter prices, contact names, or NDA facts from memory
- Copy content from `isv-ai-wiki-private` into public pages
- Score DLMS at the cloud row when the claim is meter/DCU layer
- Upgrade a `claim` to a documented fact without a citation

## Prefer

- Quote the wiki page URL + citation number
- Point at `meter-vendor-study.html` and `meter-benchmark/*.json` for structured data
- Say “not on the public wiki” when private outreach material is required
