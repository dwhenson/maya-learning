#!/usr/bin/env bash
# Netlify build: copy only the public files into dist/, stamp the service worker
# with this deploy's commit, and list every file so the app can cache them for offline use.
set -euo pipefail
rm -rf dist && mkdir dist
cp -R index.html manifest.webmanifest sw.js lessons assets reference icons dist/
cd dist
VERSION="${COMMIT_REF:-local}"
sed -i.bak "s/__BUILD__/${VERSION:0:7}/" sw.js && rm sw.js.bak
find . -type f ! -name sw.js ! -name precache.json ! -name '.*' | sed 's|^\.||' | LC_ALL=C sort |
  awk 'BEGIN { printf "[" } { printf "%s\"%s\"", (NR > 1 ? "," : ""), $0 } END { print "]" }' > precache.json
echo "Built dist/ (version ${VERSION:0:7}); precache.json lists $(tr ',' '\n' < precache.json | wc -l | tr -d ' ') files"
