#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Un seul serveur (Mastra) sert à la fois la page et l'API de génération —
# voir specs/etape-5-connexion-frontend-backend.md.
pnpm build
pnpm exec mastra dev
