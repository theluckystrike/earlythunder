#!/usr/bin/env python3
"""Merge citation data from PDF extraction agents into opportunities.json.

Reads citation files from data/citations/ (produced by 3 parallel agents),
merges them with existing citations, deduplicates, categorizes, and writes
the updated opportunities.json.

Agent C4 -- EarlyThunder citation pipeline.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# --- Named Constants (no global mutable state) ---
MAX_ENTRIES: int = 600
MAX_CITATIONS_PER: int = 50
MAX_CITATION_FILES: int = 20
FUZZY_SIMILARITY_THRESHOLD: float = 0.80
URL_FILL_SIMILARITY_THRESHOLD: float = 0.60  # more generous for filling empty URLs

DATA_DIR: Path = Path(__file__).resolve().parent.parent / "data"
OPPORTUNITIES_FILE: Path = DATA_DIR / "opportunities.json"
CITATIONS_DIR: Path = DATA_DIR / "citations"

CITATION_TYPE_ORDER: dict[str, int] = {
    "official": 0,
    "data": 1,
    "news": 2,
    "research": 3,
    "filing": 4,
    "github": 5,
}

KNOWN_URLS: dict[str, dict[str, str]] = {
    "bittensor": {"official": "https://bittensor.com", "data": "https://www.coingecko.com/en/coins/bittensor", "github": "https://github.com/opentensor/bittensor"},
    "helion-energy": {"official": "https://www.helionenergy.com"},
    "babylon": {"official": "https://babylonlabs.io", "data": "https://www.coingecko.com/en/coins/babylon"},
    "ondo-finance": {"official": "https://ondo.finance", "data": "https://www.coingecko.com/en/coins/ondo-finance"},
    "form-energy": {"official": "https://formenergy.com"},
    "united-therapeutics": {"official": "https://www.unither.com", "data": "https://finance.yahoo.com/quote/UTHR"},
    "unusual-machines": {"official": "https://www.unusualmachines.com", "data": "https://finance.yahoo.com/quote/UMAC"},
    "evolv-technology": {"official": "https://www.evolvtechnology.com", "data": "https://finance.yahoo.com/quote/EVLV"},
    "eigenlayer": {"official": "https://www.eigenlayer.xyz", "data": "https://www.coingecko.com/en/coins/eigenlayer", "github": "https://github.com/Layr-Labs"},
    "commonwealth-fusion-systems": {"official": "https://cfs.energy"},
    "commonwealth-fusion": {"official": "https://cfs.energy"},
    "cameco": {"official": "https://www.cameco.com", "data": "https://finance.yahoo.com/quote/CCJ"},
    "ionq": {"official": "https://ionq.com", "data": "https://finance.yahoo.com/quote/IONQ"},
    "render-network": {"official": "https://rendernetwork.com", "data": "https://www.coingecko.com/en/coins/render-token"},
    "filecoin": {"official": "https://filecoin.io", "data": "https://www.coingecko.com/en/coins/filecoin", "github": "https://github.com/filecoin-project"},
    "helium": {"official": "https://www.helium.com", "data": "https://www.coingecko.com/en/coins/helium"},
    "akash-network": {"official": "https://akash.network", "data": "https://www.coingecko.com/en/coins/akash-network", "github": "https://github.com/akash-network"},
    "neuralink": {"official": "https://neuralink.com"},
    "altos-labs": {"official": "https://altoslabs.com"},
    "worldcoin-world": {"official": "https://worldcoin.org", "data": "https://www.coingecko.com/en/coins/worldcoin-wld"},
    "near-protocol": {"official": "https://near.org", "data": "https://www.coingecko.com/en/coins/near", "github": "https://github.com/near"},
    "vitadao": {"official": "https://www.vitadao.com", "data": "https://www.coingecko.com/en/coins/vitadao"},
    "hivemapper": {"official": "https://hivemapper.com", "data": "https://www.coingecko.com/en/coins/hivemapper"},
    "geodnet": {"official": "https://geodnet.com", "data": "https://www.coingecko.com/en/coins/geodnet"},
    "dimo": {"official": "https://dimo.zone", "data": "https://www.coingecko.com/en/coins/dimo"},
    "story-protocol": {"official": "https://www.storyprotocol.xyz", "data": "https://www.coingecko.com/en/coins/story-protocol"},
    "ritual": {"official": "https://ritual.net", "github": "https://github.com/ritual-net"},
    "gensyn": {"official": "https://www.gensyn.ai"},
    "farcaster": {"official": "https://www.farcaster.xyz", "github": "https://github.com/farcasterxyz"},
    "sprott-uranium-trust": {"data": "https://finance.yahoo.com/quote/SRUUF"},
    "nexgen-energy": {"official": "https://www.nexgenenergy.ca", "data": "https://finance.yahoo.com/quote/NXE"},
    "mp-materials": {"official": "https://mpmaterials.com", "data": "https://finance.yahoo.com/quote/MP"},
    "twist-bioscience": {"official": "https://www.twistbioscience.com", "data": "https://finance.yahoo.com/quote/TWST"},
    "nuscale-power": {"official": "https://www.nuscalepower.com", "data": "https://finance.yahoo.com/quote/SMR"},
    "american-superconductor": {"official": "https://www.amsc.com", "data": "https://finance.yahoo.com/quote/AMSC"},
    "energy-fuels": {"official": "https://www.energyfuels.com", "data": "https://finance.yahoo.com/quote/UUUU"},
    "ouster": {"official": "https://ouster.com", "data": "https://finance.yahoo.com/quote/OUST"},
    "redwire": {"official": "https://redwirespace.com", "data": "https://finance.yahoo.com/quote/RDW"},
    "virtuals-protocol": {"official": "https://www.virtuals.io", "data": "https://www.coingecko.com/en/coins/virtuals-protocol"},
    "elizaos": {"official": "https://elizaos.ai", "data": "https://www.coingecko.com/en/coins/elizaos", "github": "https://github.com/elizaos"},
    "cow-protocol": {"official": "https://cow.fi", "data": "https://www.coingecko.com/en/coins/cow-protocol"},
    "bio-protocol": {"official": "https://www.bio.xyz", "data": "https://www.coingecko.com/en/coins/bio-protocol"},
    "qubic": {"official": "https://qubic.org", "data": "https://www.coingecko.com/en/coins/qubic"},
    "goldfinch": {"official": "https://goldfinch.finance", "data": "https://www.coingecko.com/en/coins/goldfinch"},
    "maple-finance": {"official": "https://www.maple.finance", "data": "https://www.coingecko.com/en/coins/maple-finance"},
    "d-wave-quantum": {"official": "https://www.dwavesys.com", "data": "https://finance.yahoo.com/quote/QBTS"},
    "grass-network": {"official": "https://www.getgrass.io", "data": "https://www.coingecko.com/en/coins/grass"},
    "mina-protocol": {"official": "https://minaprotocol.com", "data": "https://www.coingecko.com/en/coins/mina-protocol", "github": "https://github.com/MinaProtocol"},
    "aleo": {"official": "https://aleo.org", "data": "https://www.coingecko.com/en/coins/aleo", "github": "https://github.com/AleoHQ"},
    "autonolas": {"official": "https://olas.network", "data": "https://www.coingecko.com/en/coins/autonolas", "github": "https://github.com/valory-xyz"},
    "opulous": {"official": "https://opulous.org", "data": "https://www.coingecko.com/en/coins/opulous"},
    "io-net": {"official": "https://io.net", "data": "https://www.coingecko.com/en/coins/io-net"},
}


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

def normalize_name(name: str) -> str:
    """Normalize an opportunity name for fuzzy matching.

    Lowercases, strips whitespace, removes common suffixes and punctuation.
    Returns a canonical key suitable for dict lookups.
    """
    assert isinstance(name, str), "name must be a string"
    result = name.strip().lower()
    # Remove common suffixes/noise
    for noise in (" protocol", " network", " finance", " energy", " labs"):
        result = result.replace(noise, "")
    # Strip non-alphanumeric except hyphens
    result = re.sub(r"[^a-z0-9\-]", "", result)
    # Collapse multiple hyphens
    result = re.sub(r"-+", "-", result).strip("-")
    return result


def slugify(name: str) -> str:
    """Convert a display name to a slug (lowercase, hyphens)."""
    assert isinstance(name, str), "name must be a string"
    result = name.strip().lower()
    result = re.sub(r"[^a-z0-9]+", "-", result)
    result = result.strip("-")
    return result


def word_set(text: str) -> set[str]:
    """Extract the set of lowercase words from text."""
    assert isinstance(text, str), "text must be a string"
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def word_similarity(text_a: str, text_b: str) -> float:
    """Compute Jaccard similarity between word sets of two texts.

    Returns a float in [0.0, 1.0]. Returns 0.0 if both are empty.
    """
    assert isinstance(text_a, str), "text_a must be a string"
    assert isinstance(text_b, str), "text_b must be a string"
    words_a = word_set(text_a)
    words_b = word_set(text_b)
    if not words_a and not words_b:
        return 0.0
    union_size = len(words_a | words_b)
    if union_size == 0:
        return 0.0
    return len(words_a & words_b) / union_size


def citation_sort_key(citation: dict[str, Any]) -> tuple[int, str]:
    """Return a sort key: (type_order, claim_text)."""
    ctype = citation.get("type", "news")
    order = CITATION_TYPE_ORDER.get(ctype, 99)
    claim = citation.get("claim", "")
    return (order, claim)


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_opportunities(filepath: Path) -> list[dict[str, Any]]:
    """Load and validate the opportunities JSON array."""
    assert filepath.exists(), f"Opportunities file not found: {filepath}"
    with open(filepath, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    assert isinstance(data, list), "Top-level must be a JSON array"
    assert len(data) <= MAX_ENTRIES, f"Too many entries: {len(data)}"
    return data


def load_citation_file(filepath: Path) -> dict[str, Any] | None:
    """Load a single citation JSON file. Returns None on error."""
    assert filepath.exists(), f"Citation file not found: {filepath}"
    try:
        with open(filepath, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, OSError) as exc:
        print(f"  WARNING: Failed to load {filepath.name}: {exc}")
        return None

    if not isinstance(data, dict):
        print(f"  WARNING: {filepath.name} top-level is not an object")
        return None
    if "entries" not in data:
        print(f"  WARNING: {filepath.name} missing 'entries' key")
        return None
    return data


def load_all_citations(citations_dir: Path) -> list[dict[str, Any]]:
    """Load all citation JSON files from the citations directory.

    Returns a list of parsed citation file objects.
    """
    if not citations_dir.exists():
        print(f"  WARNING: Citations directory not found: {citations_dir}")
        return []

    files = sorted(citations_dir.glob("*.json"))[:MAX_CITATION_FILES]
    print(f"  Found {len(files)} citation file(s) in {citations_dir}")

    results: list[dict[str, Any]] = []
    for filepath in files:
        data = load_citation_file(filepath)
        if data is not None:
            src = data.get("source_document", filepath.stem)
            entry_count = len(data.get("entries", {}))
            print(f"    Loaded: {filepath.name} ({src}) -- {entry_count} entries")
            results.append(data)
    return results


# ---------------------------------------------------------------------------
# Name-matching index
# ---------------------------------------------------------------------------

def build_name_index(
    opportunities: list[dict[str, Any]],
) -> dict[str, int]:
    """Build a lookup from multiple name variants to opportunity index.

    Maps: slug, normalized name, normalized slug, and display name (lower)
    all to the list index in opportunities.
    """
    index: dict[str, int] = {}
    for idx, opp in enumerate(opportunities[:MAX_ENTRIES]):
        slug = opp.get("slug", "")
        name = opp.get("name", "")

        # Direct slug
        if slug:
            index[slug] = idx
        # Lowered name
        if name:
            index[name.lower()] = idx
        # Normalized name
        norm = normalize_name(name)
        if norm:
            index[norm] = idx
        # Normalized slug
        norm_slug = normalize_name(slug)
        if norm_slug:
            index[norm_slug] = idx
        # Slugified name
        slug_from_name = slugify(name)
        if slug_from_name:
            index[slug_from_name] = idx

    return index


def resolve_opportunity_index(
    entry_name: str,
    name_index: dict[str, int],
) -> int | None:
    """Find the opportunity index for a citation entry name.

    Tries multiple normalization strategies. Returns None if no match.
    """
    assert isinstance(entry_name, str), "entry_name must be a string"

    # Strategy 1: direct lowercase
    lower = entry_name.strip().lower()
    if lower in name_index:
        return name_index[lower]

    # Strategy 2: slugified
    slug = slugify(entry_name)
    if slug in name_index:
        return name_index[slug]

    # Strategy 3: normalized
    norm = normalize_name(entry_name)
    if norm in name_index:
        return name_index[norm]

    # Strategy 4: try removing trailing parentheticals
    # e.g. "NEAR Protocol (AI Pivot)" -> "NEAR Protocol"
    base = re.sub(r"\s*\(.*?\)\s*$", "", entry_name).strip()
    if base != entry_name:
        base_lower = base.lower()
        if base_lower in name_index:
            return name_index[base_lower]
        base_slug = slugify(base)
        if base_slug in name_index:
            return name_index[base_slug]
        base_norm = normalize_name(base)
        if base_norm in name_index:
            return name_index[base_norm]

    return None


# ---------------------------------------------------------------------------
# Citation merging logic
# ---------------------------------------------------------------------------

def is_duplicate_url(url: str, existing_urls: set[str]) -> bool:
    """Check if a URL (normalized) already exists in the set."""
    if not url:
        return False
    normalized = url.strip().rstrip("/").lower()
    return normalized in existing_urls


def is_duplicate_claim(
    claim: str,
    existing_claims: list[str],
) -> bool:
    """Check if a claim is too similar to any existing claim.

    Uses word-level Jaccard similarity with threshold.
    """
    assert isinstance(claim, str), "claim must be a string"
    if not claim:
        return False
    for existing in existing_claims[:MAX_CITATIONS_PER]:
        similarity = word_similarity(claim, existing)
        if similarity > FUZZY_SIMILARITY_THRESHOLD:
            return True
    return False


def normalize_url_for_set(url: str) -> str:
    """Normalize a URL for deduplication purposes."""
    return url.strip().rstrip("/").lower()


def _index_existing_citations(
    existing: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], set[str], list[str]]:
    """Build tracking structures from existing citations.

    Returns (merged_copy, seen_urls, existing_claims).
    """
    seen_urls: set[str] = set()
    existing_claims: list[str] = []
    merged: list[dict[str, Any]] = []
    for cite in existing[:MAX_CITATIONS_PER]:
        url = cite.get("url", "")
        if url:
            seen_urls.add(normalize_url_for_set(url))
        existing_claims.append(cite.get("claim", ""))
        merged.append(dict(cite))
    return merged, seen_urls, existing_claims


def _add_new_citations(
    merged: list[dict[str, Any]],
    incoming: list[dict[str, Any]],
    seen_urls: set[str],
    existing_claims: list[str],
) -> int:
    """Append non-duplicate incoming citations to merged. Returns count added."""
    added: int = 0
    for cite in incoming[:MAX_CITATIONS_PER]:
        if len(merged) >= MAX_CITATIONS_PER:
            break
        url = cite.get("url", "")
        claim = cite.get("claim", "")
        if url and is_duplicate_url(url, seen_urls):
            continue
        if is_duplicate_claim(claim, existing_claims):
            continue
        new_cite: dict[str, Any] = {
            "claim": claim, "source": cite.get("source", ""), "url": url,
        }
        ctype = cite.get("type", "")
        if ctype:
            new_cite["type"] = ctype
        merged.append(new_cite)
        if url:
            seen_urls.add(normalize_url_for_set(url))
        existing_claims.append(claim)
        added += 1
    return added


def merge_citations_for_entry(
    existing: list[dict[str, Any]],
    incoming: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], int]:
    """Merge incoming citations into existing list, deduplicating.

    Returns (merged_list, count_of_new_citations_added).
    """
    merged, seen_urls, existing_claims = _index_existing_citations(existing)
    merged = _fill_empty_urls(merged, incoming)
    # Refresh seen_urls after URL fill
    for cite in merged[:MAX_CITATIONS_PER]:
        filled_url = cite.get("url", "")
        if filled_url:
            seen_urls.add(normalize_url_for_set(filled_url))
    added = _add_new_citations(merged, incoming, seen_urls, existing_claims)
    return merged, added


def _fill_empty_urls(
    existing: list[dict[str, Any]],
    incoming: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """For existing citations with empty URLs, try to find matching URL.

    Matches by claim similarity against incoming citations.
    Uses URL_FILL_SIMILARITY_THRESHOLD (lower than dedup threshold)
    because we want to be generous about filling in missing URLs.
    Modifies and returns the existing list.
    """
    for cite in existing[:MAX_CITATIONS_PER]:
        if cite.get("url"):
            continue  # already has URL, skip
        claim = cite.get("claim", "")
        if not claim:
            continue
        # Find best matching incoming citation with a URL
        best_url: str = ""
        best_source: str = ""
        best_type: str = ""
        best_sim: float = 0.0
        for inc in incoming[:MAX_CITATIONS_PER]:
            inc_url = inc.get("url", "")
            if not inc_url:
                continue
            sim = word_similarity(claim, inc.get("claim", ""))
            if sim > URL_FILL_SIMILARITY_THRESHOLD and sim > best_sim:
                best_sim = sim
                best_url = inc_url
                best_source = inc.get("source", "")
                best_type = inc.get("type", "")
        if best_url:
            cite["url"] = best_url
            if best_source and not cite.get("source"):
                cite["source"] = best_source
            if best_type:
                cite["type"] = best_type
    return existing


# ---------------------------------------------------------------------------
# Known URL injection for top opportunities
# ---------------------------------------------------------------------------

def inject_known_urls(
    opp: dict[str, Any],
    known_urls: dict[str, dict[str, str]],
) -> tuple[list[dict[str, Any]], int]:
    """Add canonical known URLs as citations if not already present.

    Returns (updated_citations, count_added).
    """
    slug = opp.get("slug", "")
    if slug not in known_urls:
        return opp.get("citations", []), 0

    urls_for_slug = known_urls[slug]
    citations: list[dict[str, Any]] = list(opp.get("citations", []))
    added: int = 0

    # Collect existing URLs for dedup
    seen_urls: set[str] = set()
    for cite in citations[:MAX_CITATIONS_PER]:
        url = cite.get("url", "")
        if url:
            seen_urls.add(normalize_url_for_set(url))

    name = opp.get("name", slug)

    for ctype, url in urls_for_slug.items():
        if len(citations) >= MAX_CITATIONS_PER:
            break
        if is_duplicate_url(url, seen_urls):
            continue

        label = _known_url_label(ctype, name)
        citation: dict[str, Any] = {
            "claim": label,
            "source": "canonical",
            "url": url,
            "type": ctype,
        }
        citations.append(citation)
        seen_urls.add(normalize_url_for_set(url))
        added += 1

    return citations, added


def _known_url_label(ctype: str, name: str) -> str:
    """Generate a human-readable label for a known URL citation."""
    labels: dict[str, str] = {
        "official": f"{name} official website",
        "data": f"{name} market data",
        "github": f"{name} source code repository",
        "news": f"{name} news coverage",
        "research": f"{name} research",
        "filing": f"{name} regulatory filing",
    }
    return labels.get(ctype, f"{name} reference")


# ---------------------------------------------------------------------------
# Citation type summary
# ---------------------------------------------------------------------------

def compute_citation_types(
    citations: list[dict[str, Any]],
) -> dict[str, int]:
    """Count citations by type. Returns e.g. {"official": 2, "news": 3}."""
    counts: dict[str, int] = {}
    for cite in citations[:MAX_CITATIONS_PER]:
        ctype = cite.get("type", "")
        if not ctype:
            # Infer type from URL if possible
            ctype = _infer_type_from_url(cite.get("url", ""))
        if ctype:
            counts[ctype] = counts.get(ctype, 0) + 1
    return counts


def _infer_type_from_url(url: str) -> str:
    """Best-effort type inference from a URL."""
    if not url:
        return ""
    url_lower = url.lower()
    if "github.com" in url_lower:
        return "github"
    if "coingecko.com" in url_lower or "finance.yahoo.com" in url_lower:
        return "data"
    if "sec.gov" in url_lower or "edgar" in url_lower:
        return "filing"
    if "arxiv.org" in url_lower or "scholar" in url_lower:
        return "research"
    # Cannot reliably distinguish official vs news from URL alone
    return ""


# ---------------------------------------------------------------------------
# Main merge pipeline
# ---------------------------------------------------------------------------

def collect_incoming_citations(
    citation_files: list[dict[str, Any]],
    name_index: dict[str, int],
    num_opportunities: int,
) -> dict[int, list[dict[str, Any]]]:
    """Collect all incoming citations, grouped by opportunity index.

    Returns a dict mapping opportunity index -> list of citations.
    """
    # accumulator: opp_index -> list of citations
    collected: dict[int, list[dict[str, Any]]] = {}
    matched_count: int = 0
    unmatched_names: list[str] = []

    for citation_file in citation_files[:MAX_CITATION_FILES]:
        entries = citation_file.get("entries", {})
        source_doc = citation_file.get("source_document", "unknown")

        for entry_name, cites in entries.items():
            if not isinstance(entry_name, str):
                continue
            if not isinstance(cites, list):
                continue

            opp_idx = resolve_opportunity_index(entry_name, name_index)
            if opp_idx is None:
                unmatched_names.append(entry_name)
                continue

            matched_count += 1
            if opp_idx not in collected:
                collected[opp_idx] = []

            for cite in cites[:MAX_CITATIONS_PER]:
                if not isinstance(cite, dict):
                    continue
                # Tag with source document if not already tagged
                if not cite.get("source"):
                    cite["source"] = source_doc
                collected[opp_idx].append(cite)

    print(f"  Matched {matched_count} entry names to opportunities")
    if unmatched_names:
        print(f"  WARNING: {len(unmatched_names)} unmatched name(s):")
        for uname in unmatched_names[:20]:
            print(f"    - {uname}")

    return collected


def _merge_single_entry(
    opp: dict[str, Any],
    incoming_cites: list[dict[str, Any]],
    known_urls: dict[str, dict[str, str]],
) -> tuple[int, int]:
    """Merge citations for a single opportunity. Modifies opp in place.

    Returns (pdf_added, known_added).
    """
    existing = opp.get("citations", [])
    if not isinstance(existing, list):
        existing = []
    merged, pdf_added = merge_citations_for_entry(existing, incoming_cites)
    opp["citations"] = merged
    merged, known_added = inject_known_urls(opp, known_urls)
    merged.sort(key=citation_sort_key)
    opp["citations"] = merged
    type_summary = compute_citation_types(merged)
    if type_summary:
        opp["citation_types"] = type_summary
    return pdf_added, known_added


def merge_all(
    opportunities: list[dict[str, Any]],
    citation_files: list[dict[str, Any]],
    known_urls: dict[str, dict[str, str]],
) -> dict[str, int]:
    """Run the full merge pipeline. Modifies opportunities in place.

    Returns stats dict with counts.
    """
    assert len(opportunities) <= MAX_ENTRIES, "too many opportunities"
    name_index = build_name_index(opportunities)
    incoming = collect_incoming_citations(
        citation_files, name_index, len(opportunities)
    )
    stats: dict[str, int] = {
        "citations_added": 0, "entries_enriched": 0,
        "known_urls_added": 0, "entries_with_urls": 0,
        "entries_without_urls": 0, "total_citations": 0,
    }
    for idx, opp in enumerate(opportunities[:MAX_ENTRIES]):
        incoming_for_opp = incoming.get(idx, [])
        pdf_added, known_added = _merge_single_entry(
            opp, incoming_for_opp, known_urls
        )
        stats["citations_added"] += pdf_added + known_added
        stats["known_urls_added"] += known_added
        if pdf_added > 0 or known_added > 0:
            stats["entries_enriched"] += 1
        merged = opp.get("citations", [])
        has_url = any(c.get("url") for c in merged[:MAX_CITATIONS_PER])
        if has_url:
            stats["entries_with_urls"] += 1
        else:
            stats["entries_without_urls"] += 1
        stats["total_citations"] += len(merged)
    return stats


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def write_opportunities(
    filepath: Path,
    opportunities: list[dict[str, Any]],
) -> bool:
    """Write opportunities JSON with backup. Returns True on success."""
    assert filepath.parent.exists(), f"Parent dir missing: {filepath.parent}"

    # Create timestamped backup
    backup_name = f"opportunities.backup-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    backup_path = filepath.parent / backup_name
    if filepath.exists():
        backup_path.write_text(filepath.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"  Backup written: {backup_path.name}")

    # Write updated file
    with open(filepath, "w", encoding="utf-8") as fh:
        json.dump(opportunities, fh, indent=2, ensure_ascii=False)
        fh.write("\n")  # trailing newline

    print(f"  Written: {filepath}")
    return True


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> int:
    """Main entry point. Returns 0 on success, 1 on error."""
    print("=" * 60)
    print("EarlyThunder Citation Merger (Agent C4)")
    print("=" * 60)
    print(f"  Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print()

    # Validate inputs exist
    if not OPPORTUNITIES_FILE.exists():
        print(f"[FATAL] Opportunities file not found: {OPPORTUNITIES_FILE}")
        return 1

    # Load opportunities
    print("[1/5] Loading opportunities...")
    try:
        opportunities = load_opportunities(OPPORTUNITIES_FILE)
    except (json.JSONDecodeError, AssertionError, OSError) as exc:
        print(f"[FATAL] Failed to load opportunities: {exc}")
        return 1
    print(f"  Loaded {len(opportunities)} entries")
    print()

    # Load citation files
    print("[2/5] Loading citation files...")
    citation_files = load_all_citations(CITATIONS_DIR)
    if not citation_files:
        print("  No citation files found. Will only inject known URLs.")
    print()

    # Merge
    print("[3/5] Merging citations...")
    stats = merge_all(opportunities, citation_files, KNOWN_URLS)
    print()

    # Write output
    print("[4/5] Writing updated opportunities.json...")
    success = write_opportunities(OPPORTUNITIES_FILE, opportunities)
    if not success:
        print("[FATAL] Failed to write output")
        return 1
    print()

    # Report stats
    print("[5/5] Merge complete -- statistics:")
    print(f"  Total citations added:       {stats['citations_added']}")
    print(f"    from PDF extractions:      {stats['citations_added'] - stats['known_urls_added']}")
    print(f"    from known URLs:           {stats['known_urls_added']}")
    print(f"  Entries enriched:            {stats['entries_enriched']}")
    print(f"  Total citations now:         {stats['total_citations']}")
    print(f"  Entries with URLs:           {stats['entries_with_urls']}")
    print(f"  Entries still without URLs:  {stats['entries_without_urls']}")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    sys.exit(main())
