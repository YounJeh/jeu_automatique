#!/usr/bin/env bash
set -euo pipefail

FILE_PATH="$(jq -r '.tool_input.file_path // empty')"

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.html|*.md|*.yaml|*.yml)
    pnpm exec prettier --write "$FILE_PATH"
    ;;
esac
