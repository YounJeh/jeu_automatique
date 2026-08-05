#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

pnpm build
python3 -m http.server 5173 --bind 0.0.0.0 -d public
