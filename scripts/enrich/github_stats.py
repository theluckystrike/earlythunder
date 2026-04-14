#!/usr/bin/env python3
"""Enrich opportunities with GitHub repository statistics."""

import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "opportunities.json"
GITHUB_API = "https://api.github.com"
MAX_REPOS = 100
RATE_LIMIT_DELAY = 1.2  # seconds between requests


def load_opportunities():
    """Load opportunities from JSON file."""
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_opportunities(data):
    """Save opportunities to JSON file."""
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def extract_github_repos(opp):
    """Extract unique GitHub owner/repo pairs from citation URLs."""
    repos = set()
    citations = opp.get("citations", [])
    if not isinstance(citations, list):
        return repos

    pattern = re.compile(r"github\.com/([a-zA-Z0-9\-_.]+)/([a-zA-Z0-9\-_.]+)")
    for citation in citations[:50]:  # bounded iteration
        url = citation.get("url", "")
        if not isinstance(url, str):
            continue
        match = pattern.search(url)
        if match:
            owner = match.group(1)
            repo = match.group(2).rstrip("/")
            # Skip non-repo paths
            if owner not in ("topics", "features", "settings", "orgs"):
                repos.add((owner, repo))

    return repos


def github_request(path, token=None):
    """Make a GitHub API request with optional auth."""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "earlythunder-enrichment",
    }
    if token:
        headers["Authorization"] = f"token {token}"

    req = Request(f"{GITHUB_API}{path}", headers=headers)
    try:
        with urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8")), dict(resp.headers)
    except HTTPError as e:
        if e.code in (403, 429):
            print(f"  Rate limited on {path}, stopping GitHub enrichment")
            return None, {}
        if e.code == 404:
            return None, {}
        raise


def get_repo_stats(owner, repo, token=None):
    """Fetch basic repo stats: stars, contributors, last push date."""
    data, _ = github_request(f"/repos/{owner}/{repo}", token)
    if data is None:
        return None

    stars = data.get("stargazers_count", 0)
    last_push = data.get("pushed_at", "")

    time.sleep(RATE_LIMIT_DELAY)

    # Get contributor count from Link header (pagination trick)
    _, headers = github_request(
        f"/repos/{owner}/{repo}/contributors?per_page=1&anon=true", token
    )
    contrib_count = 1
    link_header = headers.get("Link", "")
    if link_header:
        last_page_match = re.search(r'page=(\d+)>; rel="last"', link_header)
        if last_page_match:
            contrib_count = int(last_page_match.group(1))

    return {
        "stars": stars,
        "contributors": contrib_count,
        "last_push": last_push,
    }


def format_recency(iso_date):
    """Format an ISO date as a human-readable relative time string."""
    if not iso_date:
        return None
    try:
        pushed = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
        days = (datetime.now(timezone.utc) - pushed).days
        if days <= 1:
            return "today"
        if days <= 7:
            return f"{days}d ago"
        if days <= 30:
            weeks = days // 7
            return f"{weeks}w ago"
        months = days // 30
        if months <= 12:
            label = f"{months}mo ago"
            return f"{label} (stale)" if days > 60 else label
        years = days // 365
        return f"{years}y ago (stale)"
    except (ValueError, TypeError):
        return None


def main():
    """Main enrichment pipeline for GitHub stats."""
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        print("Using authenticated GitHub requests (5000 req/hr)")
    else:
        print("No GITHUB_TOKEN set, using unauthenticated (60 req/hr limit)")

    data = load_opportunities()
    if not isinstance(data, list):
        print("Error: opportunities.json is not a list")
        sys.exit(1)

    print(f"Loaded {len(data)} opportunities")

    enriched = 0
    repos_checked = 0
    rate_limited = False

    for opp in data:
        if repos_checked >= MAX_REPOS:
            print(f"Reached MAX_REPOS limit ({MAX_REPOS}), stopping")
            break
        if rate_limited:
            break

        repos = extract_github_repos(opp)
        if not repos:
            continue

        # Use the first repo found (sorted for determinism)
        owner, repo = sorted(repos)[0]
        print(f"  Checking {owner}/{repo} for {opp.get('name', '?')}...")

        time.sleep(RATE_LIMIT_DELAY)
        stats = get_repo_stats(owner, repo, token)
        repos_checked += 1

        if stats is None:
            if repos_checked > 1:
                # Might be rate limited, check by trying one more
                rate_limited = True
            continue

        opp["github_stars"] = str(stats["stars"])
        opp["github_contributors"] = str(stats["contributors"])
        recency = format_recency(stats["last_push"])
        if recency:
            opp["last_github_commit"] = recency

        enriched += 1
        print(
            f"    {opp.get('name', '?'):30s}  "
            f"{stats['stars']} stars, "
            f"{stats['contributors']} contributors, "
            f"{recency}"
        )

    save_opportunities(data)
    print(f"\nDone. Enriched {enriched} entries with GitHub data ({repos_checked} repos checked)")


if __name__ == "__main__":
    main()
