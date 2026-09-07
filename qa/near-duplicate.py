#!/usr/bin/env python3
"""Near duplicate gate. Compares each new page against the whole built corpus.

Jaccard similarity over 5 word shingles of the visible prose. Any new page whose
best match against an existing page is at or above the ceiling fails the gate.

Usage: python3 qa/near-duplicate.py <out-dir> <new-path> [<new-path> ...]
"""
import sys, os, re, html

CEILING = 0.75
SHINGLE = 5
MAX_FILES = 5000

TAG = re.compile(r"<(script|style|noscript)\b.*?</\1>", re.S | re.I)
ANY_TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")
WORD = re.compile(r"[a-z0-9]+")


def prose(path):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            raw = fh.read()
    except OSError:
        return []
    raw = TAG.sub(" ", raw)
    raw = ANY_TAG.sub(" ", raw)
    raw = html.unescape(raw)
    return WORD.findall(WS.sub(" ", raw).lower())


def shingles(words):
    if len(words) < SHINGLE:
        return frozenset()
    return frozenset(" ".join(words[i:i + SHINGLE]) for i in range(len(words) - SHINGLE + 1))


def jaccard(a, b):
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def main():
    if len(sys.argv) < 3:
        print("usage: near-duplicate.py <out-dir> <new-path> ...")
        return 2
    out_dir, new_paths = sys.argv[1], sys.argv[2:]
    corpus = []
    count = 0
    for root, _dirs, files in os.walk(out_dir):
        for name in files:
            if not name.endswith(".html"):
                continue
            count += 1
            if count > MAX_FILES:
                break
            full = os.path.join(root, name)
            rel = "/" + os.path.relpath(full, out_dir)
            if any(rel == "/" + p.strip("/") + ".html" or rel == "/" + p.strip("/") + "/index.html" for p in new_paths):
                continue
            corpus.append((rel, shingles(prose(full))))
    corpus = [(rel, sh) for rel, sh in corpus if len(sh) >= 100]
    print(f"corpus pages compared: {len(corpus)} of {count} html files, pages under 100 shingles skipped")
    failed = 0
    for page in new_paths:
        candidates = [os.path.join(out_dir, page.strip("/") + ".html"),
                      os.path.join(out_dir, page.strip("/"), "index.html")]
        target = next((c for c in candidates if os.path.exists(c)), None)
        if target is None:
            print(f"MISSING  {page}  no built html found")
            failed += 1
            continue
        sh = shingles(prose(target))
        best_rel, best = "", 0.0
        for rel, other in corpus:
            score = jaccard(sh, other)
            if score > best:
                best, best_rel = score, rel
        verdict = "FAIL" if best >= CEILING else "pass"
        if verdict == "FAIL":
            failed += 1
        print(f"{verdict}  {page}  shingles={len(sh)}  best={best:.4f}  against {best_rel}")
    print(f"ceiling {CEILING}, failures {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
