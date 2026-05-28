#!/bin/sh
cd "$(dirname "$0")"
echo "ISV wiki preview → http://localhost:8765/index.html"
echo "Meeting notes  → http://localhost:8765/index.html#notes/metering-2026-05-28"
echo "Technical notes → http://localhost:8765/index.html#tech-notes"
echo "Press Ctrl+C to stop."
python3 -m http.server 8765
