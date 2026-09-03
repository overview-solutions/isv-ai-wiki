#!/bin/sh
cd "$(dirname "$0")"
PORT="${1:-18765}"
echo "Locus (Pages) → https://circaevum.github.io/locus/"
echo "Wiki shell    → http://127.0.0.1:${PORT}/index.html#village-metering/village-simulator"
echo "In-repo copy  → http://127.0.0.1:${PORT}/village-simulator/index.html"
echo "Do not use #village-metering alone — that is the wordy overview, not the sim."
echo "Press Ctrl+C to stop."
exec python3 preview_server.py "$PORT"
