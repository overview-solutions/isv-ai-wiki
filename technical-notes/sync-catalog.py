#!/usr/bin/env python3
"""Sync technical-notes/catalog.json from Cottonspace Dev Labs reports index.

Source of truth: openami-smart-village/reports/index.html
  https://github.com/rahulbhargavain/openami-smart-village

Published at: https://sattal.cottonspace.com/reports/

Preserves wiki-only fields (isvRelevance, relatedMeetingNotes, id) when merging.
"""

from __future__ import annotations

import html
import json
import re
import sys
import urllib.request
from pathlib import Path

CATALOG_PATH = Path(__file__).resolve().parent / "catalog.json"
SYNC_URL = (
    "https://raw.githubusercontent.com/rahulbhargavain/"
    "openami-smart-village/main/reports/index.html"
)
GITHUB_REPO = "https://github.com/rahulbhargavain/openami-smart-village"
COTTONSPACE_BASE = "https://sattal.cottonspace.com/reports"

CATEGORY_TYPE = {
    "Regulatory Strategy": "regulatory-strategy",
    "Funding Pitch": "funding-pitch",
    "Policy Framework": "policy-framework",
    "Technical Reference": "technical-reference",
    "Strategic Synthesis": "strategic-synthesis",
    "Regulatory Analysis": "regulatory-analysis",
    "Engineering Critique": "engineering-critique",
    "Investment Pitch": "investment-pitch",
    "Vehicle Assessment": "vehicle-assessment",
    "Industry Letter": "industry-letter",
}


def fetch_index(url: str = SYNC_URL) -> str:
    with urllib.request.urlopen(url, timeout=30) as resp:
        return resp.read().decode("utf-8")


def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def parse_cards(raw: str) -> list[dict]:
    cards = []
    for m in re.finditer(r'<a href="([^"]+\.html)" class="card">(.*?)</a>', raw, re.S):
        href = m.group(1).lstrip("/")
        if href.startswith("reports/"):
            filename = href.split("/", 1)[1]
        else:
            filename = href.split("/")[-1]

        block = m.group(2)
        tag_m = re.search(r'class="card-tag[^"]*">([^<]+)', block)
        title_m = re.search(r'class="card-title">(.*?)</div>', block, re.S)
        desc_m = re.search(r'class="card-desc">([^<]+)', block)

        tag_line = strip_html(tag_m.group(1)) if tag_m else ""
        category = ""
        report_code = ""
        if " · " in tag_line:
            left, report_code = tag_line.rsplit(" · ", 1)
            category = re.sub(r"^[\U0001F300-\U0001FAFF\u2600-\u27BF⚙️✉️⚡🌍🌱☀️🔄📐🔧🏗️📊💰🔑📶🏭🇳🇬]+\s*", "", left).strip()
        else:
            category = tag_line

        title = strip_html(title_m.group(1)) if title_m else filename
        summary = strip_html(desc_m.group(1)) if desc_m else ""

        cards.append(
            {
                "filename": filename,
                "reportCode": report_code.strip(),
                "category": category,
                "title": title,
                "summary": summary,
                "url": f"{COTTONSPACE_BASE}/{filename}",
                "sourceFile": f"reports/{filename}",
                "githubUrl": f"{GITHUB_REPO}/blob/main/reports/{filename}",
                "type": CATEGORY_TYPE.get(category, "report"),
            }
        )
    return cards


def slug_from_code(code: str) -> str:
    return code.lower().replace(" ", "-")


def match_existing(items: list[dict], card: dict) -> dict | None:
    for item in items:
        if item.get("reportCode") == card["reportCode"]:
            return item
    card_url = card["url"]
    card_file = card["filename"]
    for item in items:
        url = item.get("url", "")
        if url.endswith(card_file) or url == card_url:
            return item
    return None


def merge_catalog(existing: dict, cards: list[dict]) -> dict:
    items_in = existing.get("items") or []
    merged_items: list[dict] = []

    for card in cards:
        old = match_existing(items_in, card)
        item_id = old["id"] if old else slug_from_code(card["reportCode"] or card["filename"].replace(".html", ""))
        merged = {
            "id": item_id,
            "reportCode": card["reportCode"],
            "title": card["title"],
            "publisher": (old or {}).get("publisher", "Cottonspace Dev Labs"),
            "published": (old or {}).get("published", "May 2026"),
            "type": card["type"],
            "category": card["category"],
            "tags": (old or {}).get("tags", []),
            "url": card["url"],
            "sourceFile": card["sourceFile"],
            "githubUrl": card["githubUrl"],
            "sourceCatalog": "cottonspace-dev-labs",
            "summary": card["summary"],
            "isvRelevance": (old or {}).get("isvRelevance", ""),
            "relatedMeetingNotes": (old or {}).get("relatedMeetingNotes", []),
        }
        merged_items.append(merged)

    # Keep wiki-only entries (not on Cottonspace index)
    for item in items_in:
        if item.get("syncProtected") or item.get("sourceCatalog") not in (None, "cottonspace-dev-labs"):
            if not any(m["id"] == item["id"] for m in merged_items):
                merged_items.append(item)

    catalogs = list(existing.get("catalogs") or [])
    cottonspace = next((c for c in catalogs if c.get("id") == "cottonspace-dev-labs"), {})
    cottonspace.update(
        {
            "id": "cottonspace-dev-labs",
            "title": "Dev Labs Research Reports",
            "url": COTTONSPACE_BASE,
            "publisher": "Cottonspace / Dev Labs",
            "githubRepo": GITHUB_REPO,
            "githubReportsPath": "reports",
            "syncSource": SYNC_URL,
        }
    )
    other_catalogs = [c for c in catalogs if c.get("id") != "cottonspace-dev-labs"]
    catalogs = [cottonspace, *other_catalogs]
    if not any(c.get("id") == "cottonspace-dev-labs" for c in catalogs):
        catalogs = [cottonspace, *catalogs]

    result = {"catalogs": catalogs, "items": merged_items}
    if existing.get("reportCodeGuide"):
        result["reportCodeGuide"] = existing["reportCodeGuide"]
    return result


def main() -> int:
    dry_run = "--dry-run" in sys.argv
    raw = fetch_index()
    cards = parse_cards(raw)
    if not cards:
        print("No report cards found in index.html", file=sys.stderr)
        return 1

    existing = json.loads(CATALOG_PATH.read_text(encoding="utf-8")) if CATALOG_PATH.exists() else {}
    updated = merge_catalog(existing, cards)

    if dry_run:
        print(json.dumps(updated, indent=2, ensure_ascii=False))
        return 0

    CATALOG_PATH.write_text(json.dumps(updated, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Synced {len(updated['items'])} reports → {CATALOG_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
