#!/bin/bash

# Deploy current Astro build to Cloudflare Pages production project.

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

if [ ! -f "config/client.config.json" ]; then
  echo "Preflight FAIL: missing config/client.config.json" >&2
  exit 1
fi

PROJECT_NAME="${CF_PAGES_PROD_PROJECT:-$(read_client_config_value 'cloudflare.pagesProjectProd' '')}"
DEPLOY_BRANCH="${CF_PAGES_DEPLOY_BRANCH:-$(read_client_config_value 'cloudflare.pagesBranchProd' 'main')}"

require_non_empty "$PROJECT_NAME" "cloudflare.pagesProjectProd or CF_PAGES_PROD_PROJECT"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies (node_modules missing)..."
  npm ci
fi

echo "Building site..."
npm run build

echo "Deploying to Cloudflare Pages production project (${PROJECT_NAME})..."
npx wrangler pages deploy dist --project-name "$PROJECT_NAME" --branch "$DEPLOY_BRANCH"

echo "Production deploy completed."
