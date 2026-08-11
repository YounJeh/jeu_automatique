# Assets contrôlés : la variante `sprite` d'`AppearanceDefinition`

## Purpose

Permet à une `GameDefinition` d'afficher une image (SVG statique)
plutôt qu'une forme Canvas plate, sans jamais laisser un LLM fournir un
chemin ou une URL arbitraire, et sans qu'un asset manquant ou cassé ne
puisse casser le jeu (PHASE 9, CLAUDE.md §16). Fait suite à l'ordre
obligatoire `formes Canvas → assets prédéfinis → asset catalog → repli
garanti` ; la sélection IA de l'assetId et la génération d'images IA
restent hors périmètre (voir Incrément de suivi).

## Contract

### `AppearanceDefinition` (`src/game/definition/appearance-definition-schema.ts`)

Union discriminée sur `type`, inchangée pour `"shape"` :

```ts
{ type: "shape", shape: "rectangle" | "circle" | "triangle", color: string }
| { type: "sprite", assetId: string } // fermé par z.enum(ASSET_IDS)
```

`assetId` n'est **jamais** une chaîne libre : `z.enum()` est dérivé des
ids du catalogue lui-même (même pattern que `ENTITY_KINDS`,
`entity-definition-schema.ts`). Une `GameDefinition` ne peut donc
structurellement référencer qu'un asset déjà enregistré — Zod rejette
tout le reste avant même une validation sémantique.

### `AssetCatalogItem` (`src/game/assets/asset-catalog.ts`)

```ts
{
  id: string;
  type: "sprite";
  src: string; // "/assets/sprites/<nom>.svg", contrôlé par l'app
  width: number;
  height: number;
  fallbackColor: string; // jamais exposé au LLM, sert uniquement au repli
}
```

`ASSET_CATALOG` est une liste fermée `as const` (3 entrées au
lancement de PHASE 9 : `crystal-purple`, `meteor-small`,
`alien-green`), avec les fichiers SVG correspondants sous
`public/assets/sprites/`. `getAssetById(id)` retourne `undefined` sans
lever d'exception si l'id est inconnu.

## Runtime behavior

`GenericRenderer` (`src/game/core/render/generic-renderer.ts`) délègue
le chargement à `SpriteCache` (`sprite-cache.ts`), une machine à états
`idle → loading → loaded | error`, avec un loader injectable (même
philosophie que `RandomSource`, CLAUDE.md §13.4) — le loader par défaut
utilise `new Image()`, le chargement réel n'est donc testé qu'en
navigateur, pas en Vitest (pas de jsdom/happy-dom dans ce repo).

Pour chaque frame :

- `assetId` inconnu du catalogue (défense en profondeur, ne devrait
  pas arriver post-validation schéma) → repli immédiat ;
- statut `idle` → déclenche `SpriteCache.request(...)`, dessine le
  repli pour cette frame ;
- statut `loading` → dessine le repli ;
- statut `loaded` → `ctx.drawImage(...)` ;
- statut `error` (échec réseau/404) → dessine le repli, définitivement.

Le repli est toujours un rectangle plein de la couleur
`fallbackColor` du catalogue. Aucune branche ne peut lever d'exception
ni bloquer la boucle de rendu.

## Validation rules

- Schéma (`appearanceDefinitionSchema`) : `assetId` fermé par
  `z.enum(ASSET_IDS)`.
- Aucune règle sémantique dédiée : contrairement aux références
  d'entités (`checkSpawnEntityReferences`, dynamiques par définition),
  l'ensemble des `assetId` valides est fixe et déjà fermé au niveau
  schéma — une règle sémantique serait redondante et jamais atteinte.

## Security notes (CLAUDE.md §16 "Interdit pendant PHASE 9" / §23)

- Un LLM ne peut jamais écrire un chemin filesystem ou une URL
  arbitraire dans le runtime : `assetId` est une énumération fermée,
  `src` n'existe que dans le catalogue contrôlé par l'application.
- Aucun SVG/HTML n'est injecté depuis une sortie LLM : les fichiers
  sous `public/assets/sprites/` sont écrits par l'application, jamais
  générés dynamiquement à partir d'une entrée utilisateur.
- Un asset manquant, lent ou cassé ne casse jamais le jeu (repli
  garanti, vérifié manuellement en navigateur — 404 simulé sur un
  sprite → rendu de repli, aucune exception, `pnpm check` inchangé).

## Tests

- `src/tests/unit/asset-catalog.test.ts` — unicité des ids,
  dimensions positives, `getAssetById`.
- `src/tests/unit/appearance-definition-schema.test.ts` — variante
  `sprite` acceptée avec un `assetId` connu, rejetée hors catalogue ou
  avec des champs de la variante `shape`.
- `src/tests/unit/sprite-cache.test.ts` — machine à états avec un
  loader factice (résolution, rejet, exception synchrone, dédoublonnage).
- `src/tests/unit/sprite-game-definition.test.ts` — exemple bout-en-bout
  (schéma, sémantique, jouabilité, chargement `GenericRuntime`).
- Vérification manuelle en navigateur (non automatisée, cf.
  `tasks/todo.md` Checkpoint B) : chargement réel via `new Image()`,
  et repli sur échec de chargement (404 simulé).

## Incrément de suivi (hors périmètre de PHASE 9)

Deux étapes de l'ordre CLAUDE.md §16 restent volontairement non
traitées :

1. **Sélection IA de l'assetId** dans le workflow Mastra
   (`infer-game-definition-step.ts`) : nécessite un mapping thème →
   catalogue, décision produit distincte, proposée comme itération
   séparée.
2. **Génération d'images IA** (§16.4) : gated par ses propres
   prérequis (runtime générique stable, catalogue stable, repli
   existant, chargement testé) — ce que ce document décrit constitue
   ces prérequis, mais franchir cette porte reste une décision produit
   séparée, pas un sous-effet de PHASE 9.
