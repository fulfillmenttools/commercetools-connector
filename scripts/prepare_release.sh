#!/usr/bin/env bash

if [ X"$1" = X ]; then
  echo "Usage: $(basename "$0") <version>"
  exit 0
fi

set -eu

VERSION="$1"

ROOT="$(dirname "$(readlink -f "$0")")"
cd "$ROOT/.." || exit 1

for m in shared service event; do
  cd "$m" || exit 1

  echo "Preparing release of module '$m'"

  npm ci --ignore-scripts --progress=false --fund=false --fetch-retries=5
  npm version "$VERSION"

  cd ..
done

echo "New version: $(jq -r '.version' shared/package.json)"
echo "Done."
