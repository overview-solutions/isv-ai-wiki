#!/bin/bash
# Run this from the isv-wiki directory to initialize and push to GitHub
# Usage: bash setup_git.sh

set -e

echo "→ Initializing git repo..."
git init
git branch -M main

echo "→ Adding all files..."
git add .
git commit -m "feat: initial ISV wiki with PostGIS + TimescaleDB schema

- Standalone AI-editable wiki (index.html, no build step)
- PostgreSQL schema: PostGIS spatial, TimescaleDB time-series, pgvector optional
- GitHub Actions workflow for Pages deployment (auto SSL)
- OpenAMI GeoJSON-compatible microgrid asset tables
- ADCP tidal, energy metrics, drone telemetry hypertables with compression policies"

echo "→ Adding remote..."
git remote add origin https://github.com/Overview-Solutions/isv-wiki.git

echo "→ Pushing..."
git push -u origin main

echo ""
echo "✓ Done. Now enable GitHub Pages:"
echo "  Settings → Pages → Source: GitHub Actions"
echo "  Your wiki will be live at: https://overview-solutions.github.io/isv-wiki"
