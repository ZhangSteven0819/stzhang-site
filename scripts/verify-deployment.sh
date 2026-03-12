#!/bin/bash

# Deployment verification for template clients.

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

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

MAIN_DOMAIN="${MAIN_DOMAIN:-$(read_client_config_value 'domains.production' 'example.no')}"
DEV_DOMAIN="${DEV_DOMAIN:-$(read_client_config_value 'domains.dev' 'example-clinic-dev.pages.dev')}"
PROXY_DOMAIN="${PROXY_DOMAIN:-$(read_client_config_value 'domains.cmsProxy' 'decap.example.no')}"
CMS_BRANCH="${CMS_BRANCH:-$(read_client_config_value 'repository.branch' 'main')}"
CMS_SITE_ORIGIN="${CMS_SITE_ORIGIN:-$(read_client_config_value 'cms.siteOrigin' "https://$MAIN_DOMAIN")}"

# Function to check HTTP status
check_url() {
  local url="$1"
  local name="$2"

  echo -n "Checking $name ($url)... "

  if curl -s -f -I "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
    return 0
  else
    echo -e "${RED}✗ FAILED${NC}"
    return 1
  fi
}

# Function to check content
check_content() {
  local url="$1"
  local expected="$2"
  local name="$3"

  echo -n "Checking $name content... "

  if curl -s "$url" | grep -q "$expected"; then
    echo -e "${GREEN}✓ OK${NC}"
    return 0
  else
    echo -e "${RED}✗ FAILED${NC}"
    return 1
  fi
}

check_domain_dns() {
  local domain="$1"
  echo -n "Resolving $domain... "

  if dig +short "$domain" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
  else
    echo -e "${RED}✗ FAILED${NC}"
  fi
}

check_status_regex() {
  local url="$1"
  local expected_regex="$2"
  local name="$3"
  local status

  status="$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)"
  echo -n "Checking $name ($url)... "

  if [[ "$status" =~ $expected_regex ]]; then
    echo -e "${GREEN}✓ OK${NC} (status: $status)"
    return 0
  else
    echo -e "${RED}✗ FAILED${NC} (status: ${status:-unknown}, expected: $expected_regex)"
    return 1
  fi
}

echo "🔍 Verifying deployment"
echo ""

echo "📍 Testing Production Site"
echo "========================="
check_url "https://$MAIN_DOMAIN" "Main site"
check_url "https://$MAIN_DOMAIN/about" "About page"
check_url "https://$MAIN_DOMAIN/blog/welcome" "Blog post"
check_url "https://$MAIN_DOMAIN/admin/" "CMS admin interface"
echo ""

echo "🧪 Testing DEV Site"
echo "==================="
check_url "https://$DEV_DOMAIN" "DEV main site"
check_url "https://$DEV_DOMAIN/about" "DEV about page"
check_url "https://$DEV_DOMAIN/blog/welcome" "DEV blog post"
check_url "https://$DEV_DOMAIN/admin/" "DEV CMS admin interface"
echo ""

echo "🔐 Testing OAuth Proxy"
echo "======================"
check_url "https://$PROXY_DOMAIN/health" "OAuth proxy health"
check_content "https://$PROXY_DOMAIN/health" '"ok":true' "OAuth proxy health response"
check_status_regex "https://$PROXY_DOMAIN/auth?site_id=$DEV_DOMAIN" '^(200|302)$' "OAuth /auth for DEV origin"

if [ "$CMS_BRANCH" = "dev" ] && [ "$CMS_SITE_ORIGIN" = "https://$DEV_DOMAIN" ]; then
  check_status_regex "https://$PROXY_DOMAIN/auth?site_id=$MAIN_DOMAIN" '^403$' "OAuth /auth for PROD origin (prelaunch lock)"
else
  check_status_regex "https://$PROXY_DOMAIN/auth?site_id=$MAIN_DOMAIN" '^(200|302)$' "OAuth /auth for PROD origin"
fi
echo ""

echo "🔧 Testing DNS Resolution"
echo "=========================="
check_domain_dns "$MAIN_DOMAIN"
check_domain_dns "$DEV_DOMAIN"
check_domain_dns "$PROXY_DOMAIN"
echo ""

echo "📋 Deployment Summary"
echo "====================="
echo -e "${YELLOW}Note:${NC} This script only verifies that URLs are accessible."
echo "For full CMS functionality, ensure:"
echo "  1. GitHub OAuth app is configured"
echo "  2. Worker secrets (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET) are set"
echo "  3. ALLOWED_ORIGINS includes all active CMS origin(s) + localhost"
echo ""
