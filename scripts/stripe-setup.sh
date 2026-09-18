#!/usr/bin/env bash
# stripe-setup.sh — Automated Stripe product, price, payment link, and webhook setup
# for EarlyThunder Pro (Analyst tier, $49/month)
set -euo pipefail

readonly PRODUCT_NAME="EarlyThunder Pro"
readonly PRODUCT_DESC="Full intelligence access. Deep analysis, 8-signal radar charts, catalyst tracking, and weekly research reports."
readonly PRICE_CENTS=4900
readonly CURRENCY="usd"
readonly INTERVAL="month"
readonly SUCCESS_URL="https://earlythunder.com/welcome"
readonly WEBHOOK_URL="https://api.earlythunder.com/api/webhooks/stripe"
readonly ENV_FILE=".env.local"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# --- Utility functions ---

log_info() {
    printf "\033[0;36m[INFO]\033[0m %s\n" "$1"
}

log_ok() {
    printf "\033[0;32m[ OK ]\033[0m %s\n" "$1"
}

log_error() {
    printf "\033[0;31m[ERR ]\033[0m %s\n" "$1" >&2
}

die() {
    log_error "$1"
    exit 1
}

# Extract a field from Stripe CLI JSON output.
# Usage: stripe_field "field_name" <<< "$json"
stripe_field() {
    local field="$1"
    local value
    value=$(jq -r ".${field} // empty" 2>/dev/null) || die "Failed to parse JSON field: ${field}"
    if [[ -z "${value}" ]]; then
        die "Missing expected field '${field}' in Stripe response"
    fi
    printf '%s' "${value}"
}

# Append a key=value pair to .env.local, replacing if key already exists.
env_set() {
    local key="$1"
    local value="$2"
    local env_path="${PROJECT_DIR}/${ENV_FILE}"

    if [[ -f "${env_path}" ]] && grep -q "^${key}=" "${env_path}" 2>/dev/null; then
        # Replace existing line (macOS-compatible sed)
        sed -i '' "s|^${key}=.*|${key}=${value}|" "${env_path}"
    else
        printf '%s=%s\n' "${key}" "${value}" >> "${env_path}"
    fi
    log_ok "Set ${key} in ${ENV_FILE}"
}

# --- Preflight checks ---

preflight_check() {
    if ! command -v stripe &>/dev/null; then
        die "Stripe CLI not found. Install: brew install stripe/stripe-cli/stripe"
    fi
    log_ok "Stripe CLI found at $(command -v stripe)"

    if ! command -v jq &>/dev/null; then
        die "jq not found. Install: brew install jq"
    fi
    log_ok "jq found"

    # Verify authentication by listing one product
    if ! stripe products list --limit 1 &>/dev/null; then
        die "Stripe CLI not authenticated. Run: stripe login"
    fi
    log_ok "Stripe CLI authenticated"
}

# --- Core setup functions ---

create_product() {
    log_info "Creating product: ${PRODUCT_NAME}"
    local response
    response=$(stripe products create \
        --name="${PRODUCT_NAME}" \
        --description="${PRODUCT_DESC}" \
        --metadata[tier]="analyst" \
        --metadata[app]="earlythunder" \
        2>&1) || die "Failed to create product: ${response}"

    local product_id
    product_id=$(printf '%s' "${response}" | stripe_field "id")
    log_ok "Product created: ${product_id}"
    printf '%s' "${product_id}"
}

create_price() {
    local product_id="$1"
    log_info "Creating price: \$${PRICE_CENTS%00}.${PRICE_CENTS: -2}/${INTERVAL}"
    local response
    response=$(stripe prices create \
        --product="${product_id}" \
        --unit-amount="${PRICE_CENTS}" \
        --currency="${CURRENCY}" \
        --recurring[interval]="${INTERVAL}" \
        2>&1) || die "Failed to create price: ${response}"

    local price_id
    price_id=$(printf '%s' "${response}" | stripe_field "id")
    log_ok "Price created: ${price_id}"
    printf '%s' "${price_id}"
}

create_payment_link() {
    local price_id="$1"
    log_info "Creating payment link with redirect to ${SUCCESS_URL}"
    local response
    response=$(stripe payment_links create \
        --line-items[0][price]="${price_id}" \
        --line-items[0][quantity]=1 \
        --after-completion[type]="redirect" \
        --after-completion[redirect][url]="${SUCCESS_URL}" \
        2>&1) || die "Failed to create payment link: ${response}"

    local link_id link_url
    link_id=$(printf '%s' "${response}" | stripe_field "id")
    link_url=$(printf '%s' "${response}" | stripe_field "url")
    log_ok "Payment link created: ${link_id}"
    log_ok "Payment URL: ${link_url}"
    printf '%s\n%s' "${link_id}" "${link_url}"
}

create_webhook() {
    log_info "Creating webhook endpoint: ${WEBHOOK_URL}"
    local response
    response=$(stripe webhook_endpoints create \
        --url="${WEBHOOK_URL}" \
        --enabled-events="checkout.session.completed" \
        --enabled-events="customer.subscription.created" \
        --enabled-events="customer.subscription.updated" \
        --enabled-events="customer.subscription.deleted" \
        --enabled-events="invoice.payment_succeeded" \
        --enabled-events="invoice.payment_failed" \
        2>&1) || die "Failed to create webhook: ${response}"

    local webhook_id webhook_secret
    webhook_id=$(printf '%s' "${response}" | stripe_field "id")
    webhook_secret=$(printf '%s' "${response}" | stripe_field "secret")
    log_ok "Webhook created: ${webhook_id}"
    printf '%s\n%s' "${webhook_id}" "${webhook_secret}"
}

# --- Main ---

main() {
    log_info "EarlyThunder Stripe Setup"
    printf '%s\n' "──────────────────────────────────────"

    preflight_check

    # Step 1: Product
    local product_id
    product_id=$(create_product)

    # Step 2: Price
    local price_id
    price_id=$(create_price "${product_id}")

    # Step 3: Payment Link
    local link_output link_id link_url
    link_output=$(create_payment_link "${price_id}")
    link_id=$(printf '%s' "${link_output}" | head -1)
    link_url=$(printf '%s' "${link_output}" | tail -1)

    # Step 4: Webhook
    local webhook_output webhook_id webhook_secret
    webhook_output=$(create_webhook)
    webhook_id=$(printf '%s' "${webhook_output}" | head -1)
    webhook_secret=$(printf '%s' "${webhook_output}" | tail -1)

    # Step 5: Save to .env.local
    printf '\n'
    log_info "Saving configuration to ${ENV_FILE}"
    env_set "STRIPE_PRODUCT_ID" "${product_id}"
    env_set "STRIPE_PRICE_ID" "${price_id}"
    env_set "STRIPE_PAYMENT_LINK_ID" "${link_id}"
    env_set "STRIPE_PAYMENT_LINK_URL" "${link_url}"
    env_set "STRIPE_WEBHOOK_ID" "${webhook_id}"
    env_set "STRIPE_WEBHOOK_SECRET" "${webhook_secret}"

    # Summary
    printf '\n%s\n' "──────────────────────────────────────"
    log_info "Setup complete. Summary:"
    printf '  Product:      %s\n' "${product_id}"
    printf '  Price:        %s (%s%s/%s)\n' "${price_id}" "$" "$((PRICE_CENTS / 100))" "${INTERVAL}"
    printf '  Payment Link: %s\n' "${link_url}"
    printf '  Webhook:      %s\n' "${webhook_id}"
    printf '  Env file:     %s/%s\n' "${PROJECT_DIR}" "${ENV_FILE}"
    printf '%s\n' "──────────────────────────────────────"
    log_ok "Done. Payment link ready to embed in pricing page."
}

main "$@"
