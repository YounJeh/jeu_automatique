# Spec : PHASE 10 — Première nouvelle famille de jeux (top-down survival)

Statut : **proposée**, en attente de validation humaine avant tout code
(CLAUDE.md §43/§45).

Référence : CLAUDE.md §17 (PHASE 10 — ordre indicatif, règle « identifier
les primitives manquantes avant d'ajouter une famille »), §52 (PHASE 10
après PHASE 9), §38/§39 (règle d'ajout de mécanique/entité), §37
(documentation des mécaniques).

## 1. Constat préalable : état réel de PHASE 9

`docs/current-phase.md` indique encore PHASE 9. Vérifié le 2026-08-11 sur
`main` (avant création de cette branche) :

- `pnpm check` : vert (61 fichiers de tests, 382 tests, build OK).
- `pnpm test:e2e` : vert (11 passés, 5 skipped — les 5 skipped sont les
  scénarios `GENERIC_RUNTIME_ENABLED=true`, non actifs par défaut ; comportement
  attendu, pas un échec).
- Les livrables de l'exit criteria PHASE 9 (variant `sprite`, catalogue
  fermé, `SpriteCache`, repli garanti, exemple bout-en-bout,
  `docs/assets/sprite-appearance.md`) sont tous présents sur `main`.

PHASE 9 est donc traitée comme fonctionnellement terminée. Il manque
formellement l'activation de `docs/current-phase.md` → PHASE 10 (Task 1 du
plan) et la validation humaine explicite (CLAUDE.md §51.6) — cette dernière
est demandée avant le premier commit de code de ce plan, pas seulement à la
fin.

## 2. Problème

CLAUDE.md §17 fixe l'objectif de PHASE 10 : étendre le moteur à de
nouvelles familles de jeux, une par une, chacune justifiée par les
primitives génériques réellement manquantes — jamais « comme une énorme
exception ».

L'ordre indicatif donné est : _top-down survival → simple arena shooter →
simple puzzle → breakout-like → simple platformer → tower defense
simplifié_. Cet ordre n'est pas obligatoire ; CLAUDE.md demande de choisir
la prochaine famille selon la valeur produit, le nombre de primitives
nouvelles nécessaires, et la compatibilité avec le moteur existant.

Lecture du moteur actuel (`src/game/core/runtime/generic-runtime.ts`,
`src/game/definition/*.ts`) :

- `GoalDefinition` inclut déjà `{type: "survive", durationSeconds}`
  (`goal-definition-schema.ts:6-9`), utilisé aujourd'hui par le preset
  `dodge` (`src/game/definition/examples/dodge-game-definition.ts:58`).
- Les mécaniques `move`, `avoid`, `health`, `timer`, `score` existent déjà
  dans le registre fermé (`src/game/mechanics/registry.ts`).
- **Mais** `GenericRuntime.tickEntityDefinition`
  (`generic-runtime.ts:240-284`) ne connaît qu'un seul mode de déplacement
  d'entité : vitesse fixe `{x:0, y:speed}`, spawn toujours en haut de
  l'écran, culling quand l'entité sort par le bas
  (`generic-runtime.ts:262-281`, `spawnEntity` ligne 293-302). Toute entité
  à vitesse définie « tombe » ; aucune entité ne peut se déplacer vers le
  joueur.
- Un « top-down survival » typique (le joueur esquive/encaisse des
  ennemis qui le traquent, pendant une durée fixe) a besoin d'ennemis qui
  **convergent vers le joueur**, pas seulement d'ennemis qui tombent tout
  droit. C'est la primitive manquante — une seule, contrairement à
  l'exemple « platformer » de CLAUDE.md §17 qui en cite cinq
  (gravity/jump/grounded/collider/one-way).
- Le reste du pipeline (schéma, validation sémantique, `RuleEngine`,
  `GenericRenderer`, presets, catalogue, workflow Mastra) est déjà
  générique et découvre automatiquement tout nouveau preset via
  `listGamePresets()` (`src/mastra/workflows/infer-game-definition-step.ts:36,159`)
  — confirmé par lecture, aucune modification du workflow Mastra n'est
  donc nécessaire pour qu'un nouveau preset apparaisse dans les exemples du
  prompt et dans le repli par recouvrement de mécaniques.
- Point de vigilance distinct, repéré en lisant `src/app/index.ts:47-53` :
  `selectGame()` appelle `controller.loadGame(item)` sans `try/catch`. Un
  item de catalogue **sans `config`** (cas de tout nouveau preset qui ne
  réutilise pas un moteur legacy, cf. `game-catalog-item.ts:10-16`) lève
  une exception non rattrapée si `GENERIC_RUNTIME_ENABLED` est à `false`
  au moment du clic. Aujourd'hui ce risque est nul : les 3 jeux built-in
  ont tous un `config` (moteur legacy de repli). Ajouter un preset
  built-in sans `config` l'exposerait pour la première fois dans le
  catalogue permanent (pas seulement pour un jeu généré via chat, déjà
  couvert par le `try/catch` de `chat-panel.ts`).

## 3. Objectif de ce plan

Ajouter **une** primitive de mouvement générique (« seek » — l'entité se
déplace vers la position courante du joueur à chaque frame, au lieu de
tomber tout droit) au runtime générique, puis composer avec elle un
premier preset de la famille « top-down survival » (`survival`), exposé
comme jeu built-in **uniquement quand `GENERIC_RUNTIME_ENABLED` est actif**
(cf. §2, point de vigilance), avec validation sémantique/jouabilité dédiée,
tests, documentation et un cas d'éval.

## 4. Non-goals explicites

- **Pas de vague de difficulté croissante, pas de compteur d'ennemis
  simultanés plafonné** : le MVP réutilise `spawnIntervalMs` existant tel
  quel. Une escalade de difficulté est un raffinement produit séparé, pas
  un prérequis pour prouver la primitive « seek ».
- **Pas de résolution du gap `shoot`/`GenericRuntime`** documenté dans
  `docs/mechanics/shoot.md` (spawn déclenché par l'input + collision N:M) :
  hors périmètre de ce plan, différé depuis PHASE 6/7, n'a aucune
  dépendance avec « seek ».
- **Pas d'ajout d'un moteur/`Config`/`Engine`/`Renderer` legacy pour
  `survival`** : le preset est `GameDefinition`-only, exécuté uniquement
  par `GenericRuntime` (cohérent avec PHASE 7 : « moteur générique est la
  voie principale »).
- **Pas de deuxième famille dans ce plan** (arena shooter, puzzle,
  breakout, platformer, tower defense) : CLAUDE.md §17 est explicite,
  « une nouvelle famille ne doit pas être ajoutée comme une énorme
  exception » — une seule famille par plan, la suivante sera proposée
  séparément une fois celle-ci validée.
- **Pas de correctif générique de `selectGame()`/`GameController` pour
  tout item sans `config`** au-delà de ce que `survival` exige :
  la solution retenue (gating du catalogue built-in, §5) évite le
  problème pour ce preset précis sans réécrire la gestion d'erreurs de
  l'app entière, hors périmètre.

## 5. Décision d'architecture : gating du preset sans `config`

`survival` n'a pas de moteur legacy, donc pas de `config`. Si on l'ajoute
sans condition à `builtInGames`, le cliquer avec `GENERIC_RUNTIME_ENABLED`
à `false` lève une exception non rattrapée dans `selectGame()` (§2).

Solution retenue : `built-in-games.ts` n'inclut l'entrée `survival` que si
`isGenericRuntimeEnabled()` est vrai au moment de l'évaluation du module.
Ce module est importé aussi bien côté serveur (`process.env`) que côté
navigateur (`window.__GENERIC_RUNTIME_ENABLED__`, injecté par
`static-frontend-route.ts` **avant** le script de l'app — confirmé par
`static-frontend-route.test.js`, qui teste explicitement l'ordre
d'injection). Le flag est donc déjà résolu de façon fiable au moment où
`built-in-games.ts` s'exécute, des deux côtés — pas de nouvelle
infrastructure de flag nécessaire (CLAUDE.md §35 : pas de plateforme de
feature flags, une condition simple suffit).

Alternative rejetée : ajouter un `try/catch` générique autour de
`selectGame()`. Corrige un vrai gap, mais élargit le périmètre de ce plan
à toute la gestion d'erreurs de `app/index.ts` alors que le gating suffit
à rendre `survival` sûr. À proposer séparément si un futur preset
sans-config doit apparaître inconditionnellement.

## 6. Primitive ajoutée : `movementPattern` sur `EntityDefinition`

```ts
movementPattern?: "fall" | "seek"; // défaut runtime : "fall" si absent
```

- `"fall"` : comportement actuel, inchangé (vitesse fixe vers le bas,
  spawn en haut, culling en sortie d'écran).
- `"seek"` : l'entité recalcule à chaque frame un vecteur direction vers
  la position courante du joueur, normalisé puis multiplié par sa
  `speed` ; spawn sur un bord aléatoire du monde (haut/bas/gauche/droite),
  pas de culling par position (l'entité reste pertinente tant qu'elle
  n'a pas touché le joueur ou été retirée par une règle).
- Champ optionnel plutôt que requis : les trois presets existants
  (`dodge`, `collect`, `shooter`) n'ont pas besoin d'être touchés — leur
  absence de `movementPattern` continue de signifier « fall », identique
  au comportement actuel. Cohérent avec `speed`/`spawnIntervalMs`, déjà
  optionnels sur ce même schéma.

## 7. Acceptance criteria (niveau plan)

- [ ] `entityDefinitionSchema` accepte `movementPattern: "fall" | "seek"`
      (optionnel), rejette toute autre valeur.
- [ ] `GenericRuntime` déplace une entité `"seek"` vers la position du
      joueur à chaque frame ; une entité `"fall"` ou sans
      `movementPattern` a un comportement strictement inchangé (tests de
      non-régression sur les presets existants).
- [ ] `gameDefinitionPlayabilityRules` n'applique plus les formules
      spécifiques à la chute (`checkEntityCoverage`,
      `checkEntityPressure`) aux entités `"seek"`, et applique à la place
      une règle dédiée déterministe (vitesse du poursuivant vs vitesse du
      joueur).
- [ ] Un preset `survival` (`GameDefinition`-only, mécaniques
      `move`+`avoid`+`health`+`timer`, but `survive`) passe schéma +
      sémantique + jouabilité, et est exécutable par `GenericRuntime`
      sans exception (`isGenericRuntimeCapable` vrai).
- [ ] Le jeu built-in `survival` n'apparaît dans `builtInGames` que si
      `GENERIC_RUNTIME_ENABLED=true` ; avec le flag à `false`, le
      catalogue reste identique à aujourd'hui (3 jeux), aucune régression
      de `selectGame()`.
- [ ] `docs/mechanics/avoid.md` documente les deux `movementPattern`
      (nouveau fichier — cette mécanique n'était pas encore documentée).
- [ ] Un cas est ajouté à `tests/evals/game-generation-cases.json`
      couvrant un prompt de type survie/poursuite.
- [ ] `pnpm check` vert ; `pnpm test:e2e` vert flag `GENERIC_RUNTIME_ENABLED`
      ON et OFF.
- [ ] `docs/current-phase.md` reflète PHASE 10 avec le périmètre
      effectivement livré.

## 8. Modules concernés

- `src/game/definition/entity-definition-schema.ts`
- `src/game/systems/movement/movement-system.ts`
- `src/game/core/runtime/generic-runtime.ts`
- `src/game/definition/game-definition-playability-rules.ts`
- `src/game/definition/examples/survival-game-definition.ts` (nouveau)
- `src/game/presets/survival.ts` (nouveau)
- `src/game/presets/registry.ts`
- `src/game/mechanics/template-mechanics.ts`
- `src/game/types/game-template.ts`
- `src/game/catalog/built-in-games.ts`
- `docs/mechanics/avoid.md` (nouveau)
- `tests/evals/game-generation-cases.json`
- `e2e/generic-runtime-play.spec.ts` (extension)
- `docs/current-phase.md`

Détail des tâches et de l'ordonnancement : voir `tasks/plan.md` et
`tasks/todo.md`.

## 9. Questions ouvertes (non bloquantes pour démarrer)

1. Le nom exact du template (`"survival"` proposé) et son titre affiché
   sont une décision produit mineure — proposés dans le plan, ajustables
   sans impact sur l'architecture.
2. Faut-il plusieurs types d'ennemis « seek » avec des vitesses
   différentes dès ce plan, ou un seul suffit-il à prouver la primitive ?
   Ce plan retient **un seul type d'ennemi** pour rester minimal (CLAUDE.md
   §39 : pas de type d'entité sans cas d'usage) ; d'autres variantes sont
   un raffinement ultérieur.
