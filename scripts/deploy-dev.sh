#!/bin/bash

# Deploy current Astro build to Cloudflare Pages DEV project.

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

require_non_empty() {
  local value="$1"
  local label="$2"

  if [ -z "$value" ]; then
    echo "Preflight FAIL: missing required value for ${label}." >&2
    exit 1
  fi
}

verify_generated_admin_config() {
  local file="public/admin/config.yml"
  local expected_repo="$1"
  local expected_branch="$2"
  local expected_site_url="$3"
  local expected_display_url="$4"

  if [ ! -f "$file" ]; then
    echo "Preflight FAIL: missing generated file $file" >&2
    exit 1
  fi

  grep -Fq "repo: ${expected_repo}" "$file" || { echo "Preflight FAIL: CMS repo mismatch in $file" >&2; exit 1; }
  grep -Fq "branch: ${expected_branch}" "$file" || { echo "Preflight FAIL: CMS branch mismatch in $file" >&2; exit 1; }
  grep -Fq "site_url: ${expected_site_url}" "$file" || { echo "Preflight FAIL: site_url mismatch in $file" >&2; exit 1; }
  grep -Fq "display_url: ${expected_display_url}" "$file" || { echo "Preflight FAIL: display_url mismatch in $file" >&2; exit 1; }
}

if [ ! -f "config/client.config.json" ]; then
  echo "Preflight FAIL: missing config/client.config.json" >&2
  exit 1
fi

PROJECT_NAME="${CF_PAGES_DEV_PROJECT:-$(read_client_config_value 'cloudflare.pagesProjectDev' '')}"
DEPLOY_BRANCH="${CF_PAGES_DEPLOY_BRANCH:-$(read_client_config_value 'cloudflare.pagesBranchDev' 'main')}"
REPO_OWNER="$(read_client_config_value 'repository.owner' '')"
REPO_NAME="$(read_client_config_value 'repository.name' '')"
CMS_BRANCH="$(read_client_config_value 'repository.branch' 'main')"
CMS_SITE_ORIGIN="$(read_client_config_value 'cms.siteOrigin' "https://$(read_client_config_value 'domains.dev' '')")"
CMS_DISPLAY_ORIGIN="$(read_client_config_value 'cms.displayOrigin' "$CMS_SITE_ORIGIN")"

require_non_empty "$PROJECT_NAME" "cloudflare.pagesProjectDev or CF_PAGES_DEV_PROJECT"
require_non_empty "$REPO_OWNER" "repository.owner"
require_non_empty "$REPO_NAME" "repository.name"
require_non_empty "$CMS_SITE_ORIGIN" "cms.siteOrigin"
require_non_empty "$CMS_DISPLAY_ORIGIN" "cms.displayOrigin"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies (node_modules missing)..."
  npm ci
fi

echo "Building site..."
npm run build
verify_generated_admin_config "${REPO_OWNER}/${REPO_NAME}" "$CMS_BRANCH" "$CMS_SITE_ORIGIN" "$CMS_DISPLAY_ORIGIN"

echo "Deploying to Cloudflare Pages DEV project (${PROJECT_NAME})..."
npx wrangler pages deploy dist --project-name "$PROJECT_NAME" --branch "$DEPLOY_BRANCH"

echo "DEV deploy completed."
