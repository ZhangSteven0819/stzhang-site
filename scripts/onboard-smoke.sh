#!/bin/bash

# Full onboarding smoke test
# Usage: ./scripts/onboard-smoke.sh [intake-file]

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

INTAKE_FILE="${1:-config/intake/example.json}"

if [ ! -f "$INTAKE_FILE" ]; then
  echo "Intake file not found: $INTAKE_FILE"
  exit 1
fi

echo "Running onboarding from intake: $INTAKE_FILE"
npm run client:onboard -- --from-file "$INTAKE_FILE" --force

echo "Validating client config"
npm run client:validate

echo "Building"
npm run build

echo "Deploying DEV"
./scripts/deploy-dev.sh

echo "Verifying deployment"
./scripts/verify-deployment.sh

echo "Onboarding smoke test complete."
