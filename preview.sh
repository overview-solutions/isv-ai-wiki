#!/bin/sh
cd "$(dirname "$0")"
PORT="${1:-18765}"
echo "Simulator  → https://circaevum.github.io/locus/  (local /village-simulator/index.html redirects there)"
echo "Wiki shell → http://127.0.0.1:${PORT}/index.html#village-metering/village-simulator"
echo "Wiki shell → http://127.0.0.1:${PORT}/index.html#village-metering/village-simulator"
echo "Do not use #village-metering alone — that is the wordy overview, not the sim."
echo "Press Ctrl+C to stop."
exec python3 preview_server.py "$PORT"
