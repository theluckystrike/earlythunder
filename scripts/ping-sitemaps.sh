#!/bin/bash
# ============================================================================
# EarlyThunder Sitemap Ping Script
# ============================================================================
# Pings Google, Bing, and Yandex with both sitemap URLs to trigger crawling.
# Lightweight companion to submit-indexnow.sh.
#
# Cron (daily 10:05 UTC):
# 5 10 * * * /Users/mike/Desktop/BLN/bln-seo/pseo/earlythunder/scripts/ping-sitemaps.sh
# ============================================================================
set -euo pipefail

# --- Configuration ---
readonly CURL_TIMEOUT=30
readonly RATE_LIMIT_SECONDS=2

readonly SITEMAPS=(
  "https://earlythunder.com/sitemap.xml"
  "https://earlythunder.com/sitemap-research.xml"
)

# Ping endpoints (URL will be appended as query param)
readonly PING_ENDPOINTS=(
  "https://www.google.com/ping?sitemap="
  "https://www.bing.com/ping?sitemap="
  "https://yandex.com/ping?sitemap="
)

# --- Paths ---
readonly BASE_DIR="/Users/mike/Desktop/BLN/bln-seo/pseo/earlythunder"
readonly LOG_DIR="${BASE_DIR}/logs"
readonly LOG_FILE="${LOG_DIR}/sitemap-ping-$(date -u '+%Y-%m-%d').log"

# --- Counters ---
SUCCESS_COUNT=0
FAIL_COUNT=0

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
  mkdir -p "$LOG_DIR"
  # Assertion: LOG_DIR must now exist
  if [ ! -d "$LOG_DIR" ]; then
    echo "[FATAL] Cannot create log directory: $LOG_DIR" >&2
    exit 1
  fi
  echo "" >> "$LOG_FILE"
  log_msg "=========================================="
  log_msg "Sitemap Ping — earlythunder.com"
  log_msg "=========================================="
}

# ============================================================================
# ping_endpoint — Send GET request to a sitemap ping URL
# Args: $1 = full ping URL (endpoint + encoded sitemap)
# Args: $2 = label for logging
# ============================================================================
ping_endpoint() {
  local url="${1:-}"
  local label="${2:-}"
  # Assertion: URL must be non-empty
  if [ -z "$url" ]; then
    log_msg "[ERROR] ping_endpoint: no URL provided"
    return 1
  fi
  # Assertion: URL must start with https
  if [[ "$url" != https://* ]]; then
    log_msg "[ERROR] ping_endpoint: invalid URL: $url"
    return 1
  fi

  local http_code
  http_code="$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time "$CURL_TIMEOUT" \
    "$url" 2>/dev/null)" || http_code="TIMEOUT"

  local engine
  engine="$(echo "$url" | sed 's|https://||;s|/.*||')"

  if [ "$http_code" = "200" ] || [ "$http_code" = "202" ] || [ "$http_code" = "204" ]; then
    log_msg "  [OK]   $engine — HTTP $http_code ($label)"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    log_msg "  [FAIL] $engine — HTTP $http_code ($label)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  sleep "$RATE_LIMIT_SECONDS"
}

# ============================================================================
# ping_all — Iterate sitemaps x endpoints (bounded: max 6 calls)
# ============================================================================
ping_all() {
  local total_pings=$(( ${#SITEMAPS[@]} * ${#PING_ENDPOINTS[@]} ))
  log_msg "Pinging $total_pings endpoint/sitemap combinations"
  log_msg "------------------------------------------"

  # Assertion: bounded — max 10 sitemaps x 5 endpoints = 50 calls
  if [ "$total_pings" -gt 50 ]; then
    log_msg "[ERROR] Too many ping combinations: $total_pings (max 50)"
    return 1
  fi
  # Assertion: must have at least 1 ping
  if [ "$total_pings" -lt 1 ]; then
    log_msg "[ERROR] No pings to send"
    return 1
  fi

  local sitemap endpoint encoded_sitemap
  for sitemap in "${SITEMAPS[@]}"; do
    log_msg "Sitemap: $sitemap"
    for endpoint in "${PING_ENDPOINTS[@]}"; do
      # URL-encode the sitemap URL (replace : and / for safety)
      encoded_sitemap="$(python3 -c "import urllib.parse; print(urllib.parse.quote('$sitemap', safe=''))" 2>/dev/null || echo "$sitemap")"
      ping_endpoint "${endpoint}${encoded_sitemap}" "$(basename "$sitemap")"
    done
  done
}

# ============================================================================
# print_summary — Log final summary
# ============================================================================
print_summary() {
  local total=$((SUCCESS_COUNT + FAIL_COUNT))
  log_msg "=========================================="
  log_msg "SUMMARY"
  log_msg "=========================================="
  log_msg "Total pings:  $total"
  log_msg "Successful:   $SUCCESS_COUNT"
  log_msg "Failed:       $FAIL_COUNT"
  log_msg "Log file:     $LOG_FILE"
  log_msg "=========================================="

  # Assertion: warn if majority failed
  if [ "$FAIL_COUNT" -gt "$SUCCESS_COUNT" ] && [ "$total" -gt 0 ]; then
    log_msg "[WARN] More failures than successes — check connectivity"
  fi
}

# ============================================================================
# main — Entry point
# ============================================================================
main() {
  init_logging
  ping_all
  print_summary
  log_msg "Done."
}

main "$@"
