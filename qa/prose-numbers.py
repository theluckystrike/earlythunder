#!/usr/bin/env python3
"""Extracts every number that appears in the visible prose of a built page.

A number on a page is a claim. This lists them so each one can be traced to the
code path or endpoint that produced it. Numbers inside script, style, JSON-LD and
code blocks are excluded because those are machine payloads, not prose claims.

Usage: python3 qa/prose-numbers.py <html-file> [<html-file> ...]
"""
import sys, os, re, html as _html
from collections import Counter

DROP = re.compile(r"<(script|style|noscript|code|pre)\b.*?</\1>", re.S | re.I)
TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")
NUM = re.compile(r"(?<![\w/.-])(\d[\d,]*(?:\.\d+)?)(?![\w/-])")
CONTEXT = 60


def prose(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as fh:
        raw = fh.read()
    raw = DROP.sub(" ", raw)
    raw = TAG.sub(" ", raw)
    return WS.sub(" ", _html.unescape(raw)).strip()


def main():
    if len(sys.argv) < 2:
        print("usage: prose-numbers.py <html-file> ...")
        return 2
    grand = 0
    for path in sys.argv[1:]:
        if not os.path.exists(path):
            print(f"MISSING {path}")
            return 1
        text = prose(path)
        hits = list(NUM.finditer(text))
        grand += len(hits)
        counts = Counter(m.group(1) for m in hits)
        print(f"\n=== {path}")
        print(f"prose characters {len(text)}, numeric tokens {len(hits)}, distinct {len(counts)}")
        for m in hits:
            start = max(0, m.start() - CONTEXT)
            end = min(len(text), m.end() + CONTEXT)
            snippet = text[start:end].replace("\n", " ")
            print(f"  {m.group(1):>18}  ...{snippet}...")
    print(f"\ntotal numeric tokens across {len(sys.argv) - 1} pages: {grand}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
