#!/usr/bin/env bash

# CMS OAuth diagnostics for Decap + Cloudflare Worker.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

read_client_config_value() {
  local key_path="$1"
  local fallback="${2:-}"
  local value=""

  if [ -f "config/client.config.json" ]; then
    value=$(KEY_PATH="$key_path" node --input-type=module <<'NODE'
import fs from 'node:fs';

const keyPath = process.env.KEY_PATH;
const config = JSON.parse(fs.readFileSync('config/client.config.json', 'utf8'));
const value = keyPath.split('.').reduce((acc, key) => acc?.[key], config);

if (value !== undefined && value !== null && value !== '') {
  process.stdout.write(String(value));
}
NODE
)
  fi

  if [ -n "$value" ]; then
    echo "$value"
  else
    echo "$fallback"
  fi
}

PROD_DOMAIN="${MAIN_DOMAIN:-$(read_client_config_value 'domains.production' 'example.no')}"
DEV_DOMAIN="${DEV_DOMAIN:-$(read_client_config_value 'domains.dev' 'example-clinic-dev.pages.dev')}"
PROXY_DOMAIN="${PROXY_DOMAIN:-$(read_client_config_value 'domains.cmsProxy' 'decap.example.no')}"
CMS_BRANCH="${CMS_BRANCH:-$(read_client_config_value 'repository.branch' 'main')}"
CMS_SITE_ORIGIN="${CMS_SITE_ORIGIN:-$(read_client_config_value 'cms.siteOrigin' "https://$PROD_DOMAIN")}"

HAR_PATH="${1:-}"

echo "=== CMS OAuth Diagnostics ==="
echo "Production domain: $PROD_DOMAIN"
echo "DEV domain:        $DEV_DOMAIN"
echo "Proxy domain:      $PROXY_DOMAIN"
echo "HAR path:          ${HAR_PATH:-<not provided>}"
echo ""

echo "=== HAR Analysis ==="
if [ -n "$HAR_PATH" ] && [ -f "$HAR_PATH" ]; then
  HAR_PATH="$HAR_PATH" PROXY_DOMAIN="$PROXY_DOMAIN" node <<'NODE'
const fs = require('fs');

const path = process.env.HAR_PATH;
const proxyDomain = process.env.PROXY_DOMAIN;
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const entries = data.log?.entries ?? [];

const escapedProxy = proxyDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const oauthPattern = new RegExp(
  `(\\/admin\\/|\\/admin\\/config\\.yml|${escapedProxy}\\/(auth|callback|health)|github\\.com\\/login\\/oauth\\/authorize|unpkg\\.com\\/decap-cms)`
);

const selected = entries
  .map((entry, index) => ({ entry, index }))
  .filter(({ entry }) => oauthPattern.test(entry.request?.url ?? ''));

if (selected.length === 0) {
  console.log('No relevant OAuth/CMS requests found in HAR.');
} else {
  for (const { entry, index } of selected) {
    const url = entry.request?.url ?? '';
    const method = entry.request?.method ?? '?';
    const status = entry.response?.status ?? '?';
    const cfRayHeader = (entry.response?.headers ?? []).find((h) => h.name.toLowerCase() === 'cf-ray');
    const cfRay = cfRayHeader?.value ?? '-';
    console.log(
      `[${String(index + 1).padStart(2, '0')}] ${status} ${method} ${url}${cfRay !== '-' ? ` (cf-ray: ${cfRay})` : ''}`
    );
  }

  const hasAuth = selected.some(({ entry }) => /\/auth(\?|$)/.test(entry.request?.url ?? ''));
  const hasAuthorize = selected.some(({ entry }) =>
    /github\.com\/login\/oauth\/authorize/.test(entry.request?.url ?? '')
  );
  const hasCallback = selected.some(({ entry }) => /\/callback(\?|$)/.test(entry.request?.url ?? ''));

  if (!hasAuth || !hasAuthorize || !hasCallback) {
    console.log('');
    console.log(
      'HAR is incomplete for login debugging: expected /auth, GitHub authorize, and /callback in the same capture.'
    );
  }
}
NODE
else
  echo "HAR file not found (or not provided); skipping HAR analysis."
fi
echo ""

failures=0

run_check() {
  local label="$1"
  local url="$2"
  local expected_status_regex="$3"

  local headers_file body_file
  headers_file="$(mktemp)"
  body_file="$(mktemp)"

  curl -sS -D "$headers_file" "$url" -o "$body_file" || true

  local status location cf_ray body_preview
  status="$(awk 'toupper($1) ~ /^HTTP\// { code=$2 } END { print code }' "$headers_file")"
  location="$(awk 'BEGIN{IGNORECASE=1} /^location:/ { sub(/\r$/, "", $0); sub(/^[^:]*:[[:space:]]*/, "", $0); print; exit }' "$headers_file")"
  cf_ray="$(awk 'BEGIN{IGNORECASE=1} /^cf-ray:/ { print $2; exit }' "$headers_file" | tr -d '\r')"
  body_preview="$(tr '\n' ' ' < "$body_file" | tr -d '\r' | sed -E 's/[[:space:]]+/ /g' | cut -c1-260)"

  echo "[$label]"
  echo "  URL:      $url"
  echo "  Status:   ${status:-unknown} (expected: $expected_status_regex)"
  echo "  cf-ray:   ${cf_ray:-none}"
  if [ -n "$location" ]; then
    echo "  Location: $location"
  fi
  if [ -n "$body_preview" ]; then
    echo "  Body:     $body_preview"
  fi

  if [[ "${status:-}" =~ $expected_status_regex ]]; then
    echo "  Result:   OK"
  else
    echo "  Result:   FAIL"
    failures=$((failures + 1))
  fi
  echo ""

  rm -f "$headers_file" "$body_file"
}

echo "=== Live OAuth Checks ==="
if [ "$CMS_BRANCH" = "dev" ] && [ "$CMS_SITE_ORIGIN" = "https://$DEV_DOMAIN" ]; then
  EXPECTED_PROD_AUTH='^403$'
  EXPECTED_PROD_INVALID_CODE='^403$'
else
  EXPECTED_PROD_AUTH='^(200|302)$'
  EXPECTED_PROD_INVALID_CODE='^502$'
fi

run_check "auth-prod-site-id" "https://$PROXY_DOMAIN/auth?provider=github&site_id=$PROD_DOMAIN&scope=repo" "$EXPECTED_PROD_AUTH"
run_check "auth-dev-site-id" "https://$PROXY_DOMAIN/auth?provider=github&site_id=$DEV_DOMAIN&scope=repo" '^(200|302)$'
run_check "auth-forbidden-origin" "https://$PROXY_DOMAIN/auth?origin=https://evil.example" '^403$'
run_check "callback-invalid-code-dev-state" "https://$PROXY_DOMAIN/callback?state=https://$DEV_DOMAIN&code=invalid_test_code" '^502$'
run_check "callback-invalid-code-prod-state" "https://$PROXY_DOMAIN/callback?state=https://$PROD_DOMAIN&code=invalid_test_code" "$EXPECTED_PROD_INVALID_CODE"
run_check "callback-forbidden-origin" "https://$PROXY_DOMAIN/callback?state=https://evil.example&code=invalid_test_code" '^403$'
run_check "health" "https://$PROXY_DOMAIN/health" '^200$'

echo "=== Log Correlation ==="
echo "Run this in another terminal while reproducing browser login:"
echo "  cd decap-proxy && npx wrangler tail --format pretty"
echo "Correlate events by cf-ray/traceId from the checks above."
echo ""

if [ "$failures" -eq 0 ]; then
  echo "Diagnostics result: PASS"
  exit 0
else
  echo "Diagnostics result: FAIL ($failures check(s) failed)"
  exit 1
fi
