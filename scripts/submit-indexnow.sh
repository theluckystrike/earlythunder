#!/bin/bash
# ============================================================================
# EarlyThunder IndexNow Automated Submission Script
# ============================================================================
# Fetches URLs from live sitemaps, submits in batches to IndexNow endpoints.
# NASA Power of 10 compliant: bounded loops, checked returns, short functions.
#
# Cron (daily 10:00 UTC):
# 0 10 * * * /Users/mike/Desktop/BLN/bln-seo/pseo/earlythunder/scripts/submit-indexnow.sh
# ============================================================================
set -euo pipefail

# --- Configuration ---
readonly HOST="earlythunder.com"
readonly KEY="6faa68a32442439a92a10a1c430a4073"
readonly KEY_LOCATION="https://earlythunder.com/6faa68a32442439a92a10a1c430a4073.txt"
readonly SITEMAP_MAIN="https://earlythunder.com/sitemap.xml"
readonly SITEMAP_RESEARCH="https://earlythunder.com/sitemap-research.xml"
readonly BATCH_SIZE=100
readonly MAX_URLS=500
readonly MAX_BATCHES=5
readonly RATE_LIMIT_SECONDS=2
readonly CURL_TIMEOUT=30

# Standalone pages not always in sitemaps
readonly STANDALONE_PAGES=(
  "https://earlythunder.com/intelligence/"
  "https://earlythunder.com/deadlines/"
  "https://earlythunder.com/earnings/"
)

# IndexNow endpoints
readonly ENDPOINTS=(
  "https://api.indexnow.org/indexnow"
  "https://www.bing.com/indexnow"
  "https://yandex.com/indexnow"
)

# --- Paths ---
readonly BASE_DIR="/Users/mike/Desktop/BLN/bln-seo/pseo/earlythunder"
readonly LOG_DIR="${BASE_DIR}/logs"
readonly LOG_FILE="${LOG_DIR}/indexnow-$(date -u '+%Y-%m-%d').log"

# --- Counters (global) ---
SUCCESS_COUNT=0
FAIL_COUNT=0
TOTAL_SUBMITTED=0

# ============================================================================
# log_msg — Write timestamped message to log and stdout
# ============================================================================
log_msg() {
  # Assertion: message must be non-empty
  if [ -z "${1:-}" ]; then
    echo "[ERROR] log_msg called with empty message" >&2
    return 1
  fi
  local ts
  ts="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "[$ts] $1" | tee -a "$LOG_FILE"
}

# ============================================================================
# init_logging — Create log directory and initialize log file
# ============================================================================
init_logging() {
  # Assertion: BASE_DIR must exist
  if [ ! -d "$BASE_DIR" ]; then
    echo "[FATAL] Base directory does not exist: $BASE_DIR" >&2
    exit 1
  fi
  # Assertion: we can create the log dir
  mkdir -p "$LOG_DIR"
  if [ ! -d "$LOG_DIR" ]; then
    echo "[FATAL] Cannot create log directory: $LOG_DIR" >&2
    exit 1
  fi
  echo "" >> "$LOG_FILE"
  log_msg "=========================================="
  log_msg "IndexNow Submission — earlythunder.com"
  log_msg "=========================================="
}

# ============================================================================
# fetch_sitemap_urls — Parse <loc> tags from a single sitemap XML
# Args: $1 = sitemap URL
# Output: one URL per line on stdout
# ============================================================================
fetch_sitemap_urls() {
  local sitemap_url="${1:-}"
  # Assertion: URL must be provided
  if [ -z "$sitemap_url" ]; then
    log_msg "[ERROR] fetch_sitemap_urls: no URL provided"
    return 1
  fi
  # Assertion: URL must start with https
  if [[ "$sitemap_url" != https://* ]]; then
    log_msg "[ERROR] fetch_sitemap_urls: invalid URL: $sitemap_url"
    return 1
  fi

  local xml_content
  xml_content="$(curl -sS --max-time "$CURL_TIMEOUT" "$sitemap_url" 2>/dev/null)" || {
    log_msg "[WARN] Failed to fetch sitemap: $sitemap_url"
    return 0
  }

  # Extract <loc>...</loc> values using grep+sed (portable)
  echo "$xml_content" \
    | grep -oE '<loc>[^<]+</loc>' \
    | sed 's|<loc>||g;s|</loc>||g' \
    | head -n "$MAX_URLS"
}

# ============================================================================
# collect_all_urls — Gather URLs from sitemaps + standalone pages, deduplicate
# Output: populates global ALL_URLS array
# ============================================================================
collect_all_urls() {
  local tmp_file
  tmp_file="$(mktemp)"

  log_msg "Fetching sitemap: $SITEMAP_MAIN"
  fetch_sitemap_urls "$SITEMAP_MAIN" >> "$tmp_file"

  log_msg "Fetching sitemap: $SITEMAP_RESEARCH"
  fetch_sitemap_urls "$SITEMAP_RESEARCH" >> "$tmp_file"

  # Add standalone pages
  local page
  for page in "${STANDALONE_PAGES[@]}"; do
    echo "$page" >> "$tmp_file"
  done

  # Deduplicate, sort, enforce MAX_URLS bound
  local deduped
  deduped="$(sort -u "$tmp_file" | head -n "$MAX_URLS")"
  rm -f "$tmp_file"

  # Assertion: we must have at least 1 URL
  if [ -z "$deduped" ]; then
    log_msg "[ERROR] No URLs collected from sitemaps"
    return 1
  fi

  # Read into global array — bounded by MAX_URLS (bash 3 compatible)
  ALL_URLS=()
  while IFS= read -r line; do
    [ -n "$line" ] && ALL_URLS+=("$line")
  done <<< "$deduped"
  local url_count="${#ALL_URLS[@]}"

  # Assertion: URL count must be positive and within bounds
  if [ "$url_count" -lt 1 ] || [ "$url_count" -gt "$MAX_URLS" ]; then
    log_msg "[ERROR] URL count out of bounds: $url_count (max $MAX_URLS)"
    return 1
  fi

  log_msg "Collected $url_count unique URLs (max $MAX_URLS)"
}

# ============================================================================
# build_batch_json — Build the JSON payload for a batch of URLs
# Args: $1 = start index, $2 = end index (exclusive)
# Output: JSON string on stdout
# ============================================================================
build_batch_json() {
  local start="${1:-0}"
  local end="${2:-0}"
  # Assertion: indices must be valid
  if [ "$start" -ge "$end" ]; then
    log_msg "[ERROR] build_batch_json: invalid range $start-$end"
    return 1
  fi
  # Assertion: end must not exceed array size
  if [ "$end" -gt "${#ALL_URLS[@]}" ]; then
    log_msg "[ERROR] build_batch_json: end $end exceeds URL count ${#ALL_URLS[@]}"
    return 1
  fi

  local url_json=""
  local i
  for ((i=start; i<end; i++)); do
    if [ -n "$url_json" ]; then
      url_json="${url_json},"
    fi
    url_json="${url_json}\"${ALL_URLS[$i]}\""
  done

  cat <<ENDJSON
{
  "host": "$HOST",
  "key": "$KEY",
  "keyLocation": "$KEY_LOCATION",
  "urlList": [$url_json]
}
ENDJSON
}

# ============================================================================
# submit_batch_to_endpoint — POST a batch payload to one IndexNow endpoint
# Args: $1 = endpoint URL, $2 = JSON payload, $3 = batch label
# ============================================================================
submit_batch_to_endpoint() {
  local endpoint="${1:-}"
  local payload="${2:-}"
  local label="${3:-batch}"
  # Assertion: endpoint must be non-empty
  if [ -z "$endpoint" ]; then
    log_msg "[ERROR] submit_batch_to_endpoint: no endpoint"
    return 1
  fi
  # Assertion: payload must be non-empty
  if [ -z "$payload" ]; then
    log_msg "[ERROR] submit_batch_to_endpoint: no payload"
    return 1
  fi

  local engine_name
  engine_name="$(echo "$endpoint" | sed 's|https://||;s|/.*||')"

  local http_code
  http_code="$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$endpoint" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "$payload" \
    --max-time "$CURL_TIMEOUT" 2>/dev/null)" || http_code="TIMEOUT"

  if [ "$http_code" = "200" ] || [ "$http_code" = "202" ]; then
    log_msg "  [OK]   $engine_name — HTTP $http_code ($label)"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    log_msg "  [FAIL] $engine_name — HTTP $http_code ($label)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  # Rate limit between API calls
  sleep "$RATE_LIMIT_SECONDS"
}

# ============================================================================
# submit_all_batches — Split URLs into batches and submit to all endpoints
# ============================================================================
submit_all_batches() {
  local url_count="${#ALL_URLS[@]}"
  local num_batches=$(( (url_count + BATCH_SIZE - 1) / BATCH_SIZE ))

  # Assertion: batch count must be within bounds
  if [ "$num_batches" -gt "$MAX_BATCHES" ]; then
    log_msg "[WARN] Clamping batches from $num_batches to $MAX_BATCHES"
    num_batches="$MAX_BATCHES"
  fi
  # Assertion: must have at least 1 batch
  if [ "$num_batches" -lt 1 ]; then
    log_msg "[ERROR] No batches to submit"
    return 1
  fi

  log_msg "Submitting $url_count URLs in $num_batches batch(es) of up to $BATCH_SIZE"
  log_msg "Endpoints: ${#ENDPOINTS[@]} (rate limit: ${RATE_LIMIT_SECONDS}s between calls)"
  log_msg "------------------------------------------"

  local batch start end batch_count payload endpoint
  for ((batch=0; batch<num_batches; batch++)); do
    start=$((batch * BATCH_SIZE))
    end=$((start + BATCH_SIZE))
    if [ "$end" -gt "$url_count" ]; then
      end="$url_count"
    fi
    batch_count=$((end - start))
    TOTAL_SUBMITTED=$((TOTAL_SUBMITTED + batch_count))

    local label="batch $((batch+1))/$num_batches, $batch_count URLs"
    log_msg "=== Batch $((batch+1))/$num_batches ($batch_count URLs: $((start+1))-$end) ==="

    payload="$(build_batch_json "$start" "$end")"

    for endpoint in "${ENDPOINTS[@]}"; do
      submit_batch_to_endpoint "$endpoint" "$payload" "$label"
    done
  done
}

# ============================================================================
# print_summary — Log final summary statistics
# ============================================================================
print_summary() {
  local total_requests=$((SUCCESS_COUNT + FAIL_COUNT))
  # Assertion: total requests should match expected
  local expected=$(( $(( (${#ALL_URLS[@]} + BATCH_SIZE - 1) / BATCH_SIZE )) * ${#ENDPOINTS[@]} ))
  if [ "$expected" -gt $(( MAX_BATCHES * ${#ENDPOINTS[@]} )) ]; then
    expected=$(( MAX_BATCHES * ${#ENDPOINTS[@]} ))
  fi

  log_msg "=========================================="
  log_msg "SUMMARY"
  log_msg "=========================================="
  log_msg "Total unique URLs: ${#ALL_URLS[@]}"
  log_msg "URLs submitted:    $TOTAL_SUBMITTED"
  log_msg "API requests:      $total_requests (expected $expected)"
  log_msg "Successful:        $SUCCESS_COUNT"
  log_msg "Failed:            $FAIL_COUNT"
  log_msg "Log file:          $LOG_FILE"
  log_msg "=========================================="

  # Assertion: warn if high failure rate
  if [ "$FAIL_COUNT" -gt "$SUCCESS_COUNT" ] && [ "$total_requests" -gt 0 ]; then
    log_msg "[WARN] More failures than successes — check network/endpoints"
  fi
}

# ============================================================================
# main — Entry point
# ============================================================================
main() {
  init_logging
  collect_all_urls
  submit_all_batches
  print_summary
  log_msg "Done."
}

# Global URL array (populated by collect_all_urls)
ALL_URLS=()

main "$@"
