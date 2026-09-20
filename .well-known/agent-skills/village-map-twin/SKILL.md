---
name: village-map-twin
description: >
  Build or validate an ISV Village Map Twin GeoJSON pack (essential vs
  nice-to-have layers) using the wiki schema and demo-lv samples.
---

# Village Map Twin (GeoJSON)

## Definitions

- **Map Twin** — offline geotagged asset pack (GeoJSON + associations) loadable in Village Simulator.
- **Live Twin** — Map Twin plus metering API bindings (`feeds/registry.json`).

## Canonical docs

- Human/HTML: `https://isv.wiki/meter-village-geojson-un.html`
- Shell route: `https://isv.wiki/index.html#village-metering/village-geojson-un`
- Schema + samples: `https://github.com/overview-solutions/smart-village-simulator/tree/main/villages`

## Essential files (Map Twin minimum)

`village.json` · `network/subnetworks.geojson` · `structure.geojson` · `electric-lines.geojson` · `electric-devices.geojson` · `associations.json`

Every feature: `id`, `assetClass`, `assetGroup`, `subnetworkId` (self-id on island/feeder features).

## Samples

`smart-village-simulator/villages/demo-lv/` includes at least one sample of every Essential layer and Nice-to-have class (junctions, enclosure, disconnect, recloser, neutral, terminals, containment/attachment, feeds).

## Esri note

Semantics borrow Utility Network ideas; the essential/nice split is **ISV’s**, not an Esri published list. No ArcGIS required.
