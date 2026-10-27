#!/bin/sh
# Regenerates e2e/visual-snapshots with Linux Chromium (the CI/preview runner OS) in the Playwright image that matches the
# installed @playwright/test, from a scratch copy of the working tree so the host node_modules are not touched.
# Usage: npm run visual:update   (needs docker).
set -eu
cd "$(dirname "$0")/.."
V=$(node -p "require('@playwright/test/package.json').version")
WORK=$(mktemp -d)
git ls-files -z -c -o --exclude-standard -- . ':!video' ':!docs' ':!.impeccable' ':!.lhci*' ':!.superpowers' ':!PRODUCT.md' \
  | tar --null -T - -cf - | tar -xf - -C "$WORK"
mkdir -p e2e/visual-snapshots
find e2e/visual-snapshots -name '*.png' -delete
STATUS=0
docker run --rm -v "$WORK":/w -w /w -e CI=1 -e NEXT_PUBLIC_SITE_URL=https://gitprice.com "mcr.microsoft.com/playwright:v$V-noble" \
  sh -c "npm ci --no-audit --no-fund && npx playwright test --project=visual-prelaunch --project=visual-launch --update-snapshots --reporter=line" || STATUS=$?
cp "$WORK"/e2e/visual-snapshots/*.png e2e/visual-snapshots/
echo "baselines written to e2e/visual-snapshots (scratch copy: $WORK)"
exit $STATUS
