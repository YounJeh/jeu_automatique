#!/usr/bin/env bash
set -euo pipefail

echo "=== Configuration du Codespace ==="

# Active pnpm via Corepack
corepack enable

# Installe la version de pnpm définie dans package.json,
# ou la dernière version si aucune version n'est définie.
corepack prepare pnpm@latest --activate

echo "Node : $(node --version)"
echo "pnpm : $(pnpm --version)"

# Installe toutes les dépendances enregistrées dans package.json
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi

# Installe Chromium pour les tests Playwright si Playwright est présent.
if pnpm exec playwright --version >/dev/null 2>&1; then
  pnpm exec playwright install chromium
fi

# Vérifie la présence des dossiers Claude Code.
mkdir -p .claude/skills
mkdir -p .claude/agents
mkdir -p .claude/scripts

# Réinstalle les skills externes.
# Une erreur sur un skill ne doit pas bloquer toute la création du Codespace.
if command -v npx >/dev/null 2>&1; then
  npx --yes skills add https://github.com/mastra-ai/skills || true
  npx --yes skills add https://github.com/anthropics/skills \
    --skill frontend-design || true
  npx --yes skills add https://github.com/vercel-labs/agent-skills \
    --skill web-design-guidelines || true
fi

# Rend les scripts du projet exécutables.
find .claude/scripts -type f -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

echo "=== Codespace prêt ==="
