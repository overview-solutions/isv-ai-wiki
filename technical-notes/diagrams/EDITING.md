# Editing ISV topology diagrams (SVG)

The metering comms diagram is a standalone SVG file:

**`technical-notes/diagrams/metering-topology.svg`**

The meeting notes page loads it automatically. Edit the SVG, refresh the browser — no HTML changes needed for layout updates.

## Preview

```bash
cd isv-ai-wiki
./preview.sh
```

Open:

- http://localhost:8765/index.html#notes/metering-2026-05-28
- http://localhost:8765/tech-comm-2026-05-28-metering-topology.html

Toggle **Current** / **Proposed relay** to check both views.

---

## Option 1 — Visual editor (recommended for most people)

### diagrams.net (draw.io) — free, browser or desktop

**Open with SVG already loaded** (when the file is on the public web):

```
https://app.diagrams.net/?url=<encoded-public-svg-url>
```

Example (GitHub Pages):

```
https://app.diagrams.net/?url=https%3A%2F%2Foverview-solutions.github.io%2Fisv-ai-wiki%2Ftechnical-notes%2Fdiagrams%2Fmetering-topology.svg
```

The wiki **Edit in diagrams.net** links use this pattern. On localhost preview they point at the last published GitHub Pages copy (diagrams.net cannot fetch `localhost` URLs).

**Local-only / unpublished edits:** use **File → Open from → Device** and select `metering-topology.svg`.

1. Edit boxes, arrows, labels visually
2. **File → Export as → SVG**
3. Replace `metering-topology.svg` (or paste exported SVG content into the file)
4. **Important after export:** re-add `class="proposed-only"` on the proposed relay group and phone-relay node if draw.io strips custom classes (see Option 3 below)

### Inkscape — free desktop app

1. Open the `.svg` file
2. Select objects, move, recolor, add paths
3. Save as **Plain SVG**
4. Preview in browser

### Figma

1. Import SVG
2. Edit
3. Export as SVG
4. Same class caveat as draw.io for proposed-relay toggle

---

## Option 2 — Edit in Cursor / VS Code (text)

SVG is XML. Open `metering-topology.svg` and edit directly.

| Element | What it does |
|---------|----------------|
| `<rect x="…" y="…" width="…" height="…">` | Box position and size |
| `<text x="…" y="…">Label</text>` | Label (center text: `text-anchor="middle"`) |
| `<line x1="…" y1="…" x2="…" y2="…">` | Straight arrow |
| `<path d="M x y L x y …">` | Bent connector |
| `stroke="#B42318" stroke-dasharray="6 4"` | Red dashed = failure-prone path |
| `class="proposed-only"` | Hidden until **Proposed relay** toggle |

**Add a new box:** copy an existing `<g class="node">…</g>` block, change `x`/`y` and label text.

**Add a new arrow:** copy a `<line>` or `<path>`, point coordinates at box edges.

Install the **SVG Preview** extension in Cursor for a side-by-side preview while editing.

**Encoding rule:** Keep label text **ASCII-only** in the SVG (use `/` or `-` instead of special Unicode like em-dashes or middle dots). The file declares UTF-8; smart punctuation from Word or draw.io can break the browser parser.

---

## Option 3 — Proposed relay toggle

Elements that only appear when **Proposed relay** is selected must keep:

```xml
class="proposed-only"
```

on:

- `<g id="proposed-edges">` — green LTE backup lines
- `<g id="phone-relay">` — Phone relay box

The page adds `show-proposed` to the root `<svg>` when that toggle is on. Do not remove the `<style>` block at the top of the SVG.

---

## File structure inside the SVG

```
bands          → gray background layer strips
nodes-token    → STS, SMS, Phone, Cloud
nodes-local    → CIU, Meter, MacFi, Phone relay
nodes-nan      → RF Mesh, PLC, Repeater, DCU
nodes-uplink   → DCU → LTE WAN
edges-current  → all solid/dashed current paths
proposed-edges → proposed-only green paths
```

Group new content in the matching `<g id="…">` section.

---

## What not to edit for diagram-only changes

| File | When to edit |
|------|----------------|
| `metering-topology.svg` | Diagram layout, nodes, arrows |
| `tech-comm-2026-05-28-metering-topology.html` | Tables, field notes, stats, page text |
| `index.html` | Wiki navigation only |

---

## Publish

Commit and push to `isv-ai-wiki` → GitHub Pages updates the live wiki automatically.
