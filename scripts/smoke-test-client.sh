#!/bin/bash

# New-client smoke test.
# Includes build, DEV deploy, and endpoint verification.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Running client config validation..."
npm run client:validate

echo "Building site..."
npm run build

echo "Deploying DEV..."
./scripts/deploy-dev.sh

echo "Verifying deployment..."
./scripts/verify-deployment.sh

echo "Smoke test completed."
