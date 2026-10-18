#!/usr/bin/env python3
"""Diff visible wiki prose between two git refs. Ignores CSS and chrome.

Skips:
  css/, vendor JS, <style>, <script>, class/id-only HTML churn (whitespace-collapsed text).

Usage:
  python3 scripts/content-diff.py OLD NEW
  python3 scripts/content-diff.py 1be87fa HEAD
"""
from __future__ import annotations

import argparse
import difflib
import html.parser
import subprocess
import sys
from pathlib import PurePosixPath

SKIP_PREFIXES = (
    "css/",
    "js/vendor/",
    "village-simulator/js/vendor/",
    "sunspec-models/",
    ".github/",
)
SKIP_SUFFIXES = (".css", ".py", ".sh", ".svg", ".png", ".ico", ".jpg", ".woff2")
CONTENT_SUFFIXES = (".html", ".md", ".json")


class VisibleText(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._skip = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in ("style", "script", "noscript"):
            self._skip += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in ("style", "script", "noscript") and self._skip:
            self._skip -= 1

    def handle_data(self, data: str) -> None:
        if self._skip:
            return
        t = " ".join(data.split())
        if t:
            self.parts.append(t)


def git_show(ref: str, path: str) -> str | None:
    r = subprocess.run(
        ["git", "show", f"{ref}:{path}"],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        return None
    return r.stdout


def git_changed(old: str, new: str) -> list[str]:
    r = subprocess.run(
        ["git", "diff", "--name-only", old, new],
        capture_output=True,
        text=True,
        check=True,
    )
    return [p for p in r.stdout.splitlines() if p]


def keep_path(path: str) -> bool:
    p = PurePosixPath(path)
    s = path.replace("\\", "/")
    if any(s.startswith(pref) or f"/{pref}" in f"/{s}" for pref in SKIP_PREFIXES):
        return False
    if s.endswith(SKIP_SUFFIXES):
        return False
    return s.endswith(CONTENT_SUFFIXES)


def to_prose(path: str, raw: str) -> str:
    if path.endswith(".html"):
        parser = VisibleText()
        parser.feed(raw)
        parser.close()
        return "\n".join(parser.parts)
    return "\n".join(" ".join(line.split()) for line in raw.splitlines() if line.strip())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("old")
    ap.add_argument("new")
    args = ap.parse_args()
    old, new = args.old, args.new

    paths = [p for p in git_changed(old, new) if keep_path(p)]
    if not paths:
        print("No content files changed (or only CSS/vendor).")
        return 0

    n = 0
    for path in paths:
        a = git_show(old, path)
        b = git_show(new, path)
        if a is None and b is None:
            continue
        pa = to_prose(path, a or "")
        pb = to_prose(path, b or "")
        if pa == pb:
            continue
        n += 1
        label = "NEW" if a is None else ("GONE" if b is None else "EDIT")
        print(f"=== {label} {path} ===")
        for line in difflib.unified_diff(
            pa.splitlines(),
            pb.splitlines(),
            fromfile=f"{old}:{path}",
            tofile=f"{new}:{path}",
            lineterm="",
        ):
            print(line)
        print()
    if n == 0:
        print("Content files changed on disk, but visible text is the same (style/chrome only).")
    else:
        print(f"{n} file(s) with visible-text change.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
