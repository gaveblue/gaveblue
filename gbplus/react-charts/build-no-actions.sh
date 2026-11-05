#!/usr/bin/env bash
set -euo pipefail

# Alternative when GitHub-hosted Actions runners fail before starting.
# Run from the repository root in GitHub Codespaces or a Node 22 environment:
# bash gbplus/react-charts/build-no-actions.sh
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if ! node --version | grep -Eq '^v(2[024]|[3-9][0-9])\.'; then
  echo "Node.js 20 or later is required."
  exit 1
fi
node --check js/app.js
node --check js/views.js
node --check js/gb-react-loader.js
node --check js/gb-charts-data.js
node react-charts/test-bridge.mjs
cd react-charts
npm install --no-fund --no-audit
npm run build
cd "$ROOT"
test -s charts-dist/gb-react-charts.js
test -s charts-dist/gb-react-charts.css
echo "GB+ EasyUI compiled:"
du -h charts-dist/gb-react-charts.js charts-dist/gb-react-charts.css
echo
echo "Ready to commit from repository root:"
echo "  git add gbplus/charts-dist gbplus/react-charts/package-lock.json"
echo "  git commit -m 'build(charts): compile validated EasyUI bundle'"
echo "  git push"
