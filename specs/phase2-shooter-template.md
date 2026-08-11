# Spec : PHASE 2 — Troisième template (`shooter`)

Statut : **validée** — les 5 questions ouvertes ont été tranchées par
l'utilisateur (voir §12).

Référence : `CLAUDE.md` §9 (PHASE 2 — objectif, gameplay minimum, paramètres,
workflow IA, tests obligatoires, interdits, critères de sortie), §8
(PHASE 1 — les trois couches de validation que `shooter` doit respecter),
§6 (`docs/current-phase.md`), §52 (ordre de priorité : PHASE 1 avant
PHASE 2), §22 (Mastra workflow-first), §23 (sécurité : bornes strictes, pas
de valeur libre côté LLM), §29 (pyramide de tests). Complète
`specs/phase1-playability-validator.md` et `specs/phase1-playwright-e2e.md`,
qui ont mis en place les trois couches de validation et l'e2e essentiel sur
`dodge`/`collect`.

## 1. Problème

Le catalogue ne contient aujourd'hui que deux templates (`dodge`, `collect`)
structurellement très proches : un joueur, une seule catégorie d'entité
passive qui apparaît et se déplace, une collision joueur/entité qui termine
la partie instantanément (`dodge`) ou l'incrémente (`collect`). CLAUDE.md
§9 demande un troisième template « suffisamment différent pour révéler les
abstractions réellement communes » avant de commencer PHASE 3 (extraction de
systèmes partagés) : sans un troisième point de comparaison, on ne peut pas
savoir quelles duplications entre moteurs sont réelles plutôt que
coïncidentales.

`shooter` introduit des primitives absentes du moteur actuel :

- une action joueur supplémentaire (tirer, avec un temps de rechargement) ;
- deux catégories d'entités simultanées (ennemis **et** projectiles) au lieu
  d'une seule ;
- une collision qui détruit une entité au lieu de terminer la partie
  (projectile → ennemi) ;
- une ressource qui se dégrade progressivement (points de vie) au lieu d'une
  fin de partie binaire au premier contact ;
- un objectif de type « détruire N cibles » (`targetKillCount`), différent de
  « survivre T secondes » (`dodge`) et « collecter N objets » (`collect`).

L'état actuel du repo (constaté lors de l'exploration) : la séparation
schema/semantic/playability existe et est testée pour `dodge` et `collect`
(`src/game/validation/**`), le contrat de lifecycle (`start/stop/restart` +
`reset`) est en place sur les deux moteurs, et `e2e/` couvre les parcours
« jouer » et « créer par chat » (commits `44f05c5`, `b829188`). `pnpm check`
et `pnpm test:e2e` sont considérés verts. `docs/current-phase.md` n'existe
pas encore : cette feature le crée (§2, §12 Question 1 tranchée).

## 2. Objectif

Ajouter le template `shooter` en suivant strictement le pattern
architectural déjà établi par `dodge`/`collect` — même empilement de
fichiers, mêmes contrats (`GameTemplateDefinition`, `SemanticRule`,
`PlayabilityRule`, lifecycle `reset()`/`getState()`/`update()`) — intégré
de bout en bout :

1. **Config** : `ShooterGameConfig` (Zod, bornes strictes et finalisées,
   §8) réutilisant `baseGameConfigShape` + les champs propres définis par
   CLAUDE.md §9.2.
2. **Moteur** (`ShooterEngine`) : déplacement du joueur, tir avec cooldown,
   spawn/déplacement/suppression des ennemis (trajectoire verticale
   descendante, symétrique à `dodge`) et des projectiles, collisions
   projectile↔ennemi (destruction + score) et ennemi↔joueur (dégâts), fin de
   partie sur `targetKillCount` atteint (victoire), vie à 0 ou temps écoulé
   (défaite).
3. **Rendu** (`ShooterRenderer`) : formes canvas par défaut, plus un jeu de
   sprites emoji dédié (`ShooterSprites`) appliqué uniquement aux jeux
   `source: "generated"`, exactement sur le modèle de `DodgeSprites`
   (🐩/🐺) déjà utilisé par `GameController.loadGame`. Affichage score +
   vie, overlay de fin de partie — même structure que `DodgeRenderer`.
4. **Validation** : `shooterSemanticRules` (cohérence arithmétique entre
   champs déclarés) et `shooterPlayabilityRules` (simulation physique :
   pression ennemie vs. capacité de riposte/survie du joueur).
5. **Intégration** : `game-template-catalog.ts`, `game-controller.ts`
   (lifecycle + rendu + sprites), workflow Mastra (sélection + génération +
   validation à 3 branches), catalogue (`built-in-games.ts`).
6. **Documentation de phase** : créer `docs/current-phase.md` (CLAUDE.md §6)
   déclarant PHASE 2 comme phase active, avec son objectif et ses critères
   de sortie.
7. **Tests** : couverture unitaire complète du moteur, des deux couches de
   validation, mise à jour des tests existants dont l'univers passe de 2 à
   3 templates, **et un spec e2e dédié** (`e2e/shooter-play.spec.ts` + un
   cas shooter ajouté à `e2e/game-generation-chat.spec.ts`).

## 3. Non-objectifs (explicitement hors périmètre)

Interdits explicites CLAUDE.md §9 :

- créer un moteur générique (`GameRuntime`) ou une `GameDefinition` — PHASE 5/6 ;
- convertir immédiatement les trois jeux en ECS ;
- créer un DSL de règles ;
- fusionner les trois moteurs en un seul module partagé — PHASE 3, et
  seulement sur la base de duplication réellement observée ;
- supprimer ou modifier le comportement de `dodge`/`collect` ;
- générer des sprites par IA (formes canvas + emoji statiques uniquement,
  comme `dodge` aujourd'hui — pas de génération d'image).

Précisions supplémentaires propres à cette feature :

- **Pas d'extraction de systèmes communs** (`MovementSystem`,
  `CollisionSystem`, `SpawnSystem`...) : `ShooterEngine` peut dupliquer les
  motifs déjà présents dans `DodgeEngine`/`CollectEngine` (clamp de
  position, boucle spawn/avance/filtre) sans essayer de les factoriser —
  c'est le but même de PHASE 3, qui vient après.
- **Pas de centralisation complète de l'input** (`InputState` façon §10.3,
  PHASE 3) : on ajoute uniquement le champ minimal `fire` à l'`InputState`
  existant (voir Hypothèse 4), sans réécriture du contrôleur.
- Pas de types d'ennemis multiples, pas de patterns de mouvement complexes
  (une seule trajectoire, verticale, symétrique à `dodge`), pas de
  power-ups, pas de vagues scriptées, pas de plusieurs armes/munitions.
- Pas de tir automatique sans cooldown, pas de projectiles illimités —
  bornes strictes obligatoires (CLAUDE.md §9.2, §23).
- **Pas de changement du frontend applicatif** (`src/app/**`) : l'exploration
  confirme qu'aucun fichier sous `src/app` ne référence `"dodge"`/`"collect"`
  en dur (labels, icônes) — le troisième template doit s'intégrer sans
  aucune modification de ce dossier (les sprites emoji vivent côté
  `src/game/**`, comme `DodgeSprites` aujourd'hui).
- `docs/current-phase.md` reste strictement au format CLAUDE.md §6 (`Current
phase`/`Goal`/`Exit criteria`) — pas de journal de développement.

## 4. Hypothèses posées

1. **PHASE 1 est considérée close en pratique** : les trois couches de
   validation existent et sont testées sur les deux templates existants, le
   lifecycle est stable, `e2e/` couvre les parcours essentiels.
   `docs/current-phase.md` est créé par cette feature pour déclarer PHASE 2
   active (§12, Question 1 — tranchée : oui).
2. **Config partagée** : `shooter` réutilise `baseGameConfigShape` tel
   quel (`id`, `title`, `description`, `theme`, `playerColor`,
   `backgroundColor`, `playerSpeed`, `gameDurationSeconds`,
   `victoryMessage`, `defeatMessage`), complété par exactement les champs
   listés en CLAUDE.md §9.2 : `enemyColor`, `projectileColor`,
   `enemySpeed`, `enemySpawnIntervalMs`, `projectileSpeed`,
   `fireCooldownMs`, `playerHealth`, `targetKillCount`. Aucun champ
   supplémentaire non listé dans CLAUDE.md n'est ajouté.
3. **Condition de fin de partie** : `gameDurationSeconds` (hérité) sert de
   limite de temps globale, symétrique à `collect` :
   - `killCount >= targetKillCount` → `won`, à tout instant ;
   - `health <= 0` → `lost`, à tout instant (avant même la fin du temps) ;
   - `elapsedMs / 1000 >= gameDurationSeconds` sans avoir atteint
     `targetKillCount` → `lost`.
4. **Ajout de `fire: boolean` à `InputState`** (`src/game/core/game-state.ts`)
   et mapping clavier (Espace) dans `InputController`
   (`src/game/core/input.ts`). C'est un ajout non cassant : `dodge` et
   `collect` ignorent ce champ, leurs tests ne changent pas.
5. **Un seul flux de spawn par catégorie** : les ennemis et les projectiles
   suivent chacun le même motif que `obstacles`/`collectibles` dans
   `dodge`/`collect` (compteur de temps écoulé depuis le dernier spawn,
   comparé à un intervalle configuré) ; `fireCooldownMs` joue ce rôle côté
   projectiles.
6. **Trajectoire ennemie : verticale descendante, symétrique à `dodge`**
   (spawn en haut du canvas, le joueur se déplace en bas et tire vers le
   haut) — **confirmée par l'utilisateur** (§12, Question 2). Réutilise
   `rectsOverlap`/`Vector2` sans nouvelle primitive géométrique, et le
   canvas 480×640 déjà en place pour les deux autres templates.
7. **Un jeu built-in `shooter`** est ajouté à `built-in-games.ts` au même
   titre que `dodge-game`/`collect-game`. Impact direct : `game-catalog.test.ts`
   (`toHaveLength(2)` → `3`) est mis à jour dans le cadre de cette feature.
8. **Workflow Mastra — branchement à 3 cas explicite.**
   `classifyGameTemplateStep` n'a besoin d'aucun changement structurel
   (déjà générique via `GAME_TEMPLATES`/`listGameTemplateDefinitions`). En
   revanche `generateGameConfigStep` et `validateGameConfigStep`
   (`src/mastra/workflows/generate-game-workflow.ts`) codent aujourd'hui un
   `if (template === "dodge") {...} else {...}` binaire qui suppose
   implicitement que « pas dodge » veut dire « collect » : cela doit
   devenir un branchement exhaustif à 3 cas (`if`/`else if`/`else` avec un
   throw de sécurité sur le cas impossible, ou `switch` avec
   `assertNever` — CLAUDE.md §27).
9. **Sprites emoji dédiés confirmés** (§12, Question 3 — tranchée : oui) :
   `ShooterSprites` sur le modèle exact de `DodgeSprites`, appliqué
   uniquement aux jeux `source: "generated"` dans
   `GameController.loadGame`. Choix d'emoji par défaut : joueur 🚀, ennemi
   👾, projectile ✨ (ajustables sans impact structurel).
10. **Spec e2e dédié confirmé** (§12, Question 4 — tranchée : oui) : un
    nouveau fichier `e2e/shooter-play.spec.ts` (parcours « jouer », sans
    mock réseau, symétrique à `game-catalog-play.spec.ts` mais ciblant le
    jeu shooter built-in) plus un cas shooter ajouté à
    `e2e/game-generation-chat.spec.ts` (réseau mocké, comme les cas déjà
    présents).
11. **Bornes numériques finalisées dès cette itération** (§12, Question 5
    — tranchée : oui), voir §8 — pas de valeur provisoire laissée à
    trancher plus tard.
12. **Aucune nouvelle dépendance** : Zod, Vitest, Canvas déjà en place
    suffisent.

## 5. Stack technique

Inchangée — TypeScript strict, Zod, Vitest, Playwright, HTML5 Canvas,
Mastra (workflow existant étendu, pas de nouvel agent — CLAUDE.md §22.3 :
un troisième template ne justifie pas un second agent). Aucune nouvelle
dépendance.

## 6. Commandes

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm check          # les quatre ci-dessus
pnpm test:e2e        # inclut désormais e2e/shooter-play.spec.ts
pnpm typecheck:e2e
pnpm dev             # vérification manuelle du jeu shooter dans le navigateur
```

## 7. Structure du projet (fichiers concernés)

```
docs/current-phase.md                                       # nouveau — CLAUDE.md §6, déclare PHASE 2 active

src/game/types/game-template.ts                              # modifié — "shooter" ajouté à GAME_TEMPLATES

src/mastra/schemas/shooter-game-config-schema.ts             # nouveau — ShooterGameConfig (Zod strict, bornes finalisées §8)
src/mastra/schemas/generated-game-schema.ts                  # modifié — shooterGameConfigSchema dans gameConfigSchema (union discriminée à 3)

src/game/templates/shooter/
├── shooter-config.ts                                          # nouveau — dimensions canvas, tailles, defaultShooterConfig
├── shooter-engine.ts                                           # nouveau — ShooterEngine (lifecycle reset/getState/update)
├── shooter-renderer.ts                                         # nouveau — ShooterRenderer + type ShooterSprites (player/enemy/projectile)
└── shooter-template.ts                                         # nouveau — GameTemplateDefinition<ShooterGameConfig, ShooterEngine>

src/game/templates/game-template-catalog.ts                  # modifié — ConfigForTemplate/EngineForTemplate/definitions map à 3 entrées

src/game/validation/semantic/shooter-semantic-rules.ts       # nouveau
src/game/validation/playability/shooter-playability-rules.ts # nouveau

src/game/game-controller.ts                                   # modifié — ActiveGame union + case "shooter" (loadGame applique ShooterSprites si source === "generated", tick)
src/game/core/game-state.ts                                   # modifié — InputState.fire: boolean
src/game/core/input.ts                                         # modifié — mapping touche Espace → fire

src/game/catalog/built-in-games.ts                             # modifié — entrée built-in shooter

src/mastra/workflows/generate-game-workflow.ts                # modifié — 3 branches explicites (generateGameConfigStep, validateGameConfigStep), 3ᵉ libellé dans returnGamePreviewStep

src/tests/unit/shooter-engine.test.ts                          # nouveau
src/tests/unit/shooter-semantic-rules.test.ts                   # nouveau
src/tests/unit/shooter-playability-rules.test.ts                 # nouveau
src/tests/unit/game-catalog.test.ts                             # modifié — toHaveLength(2) → 3, id shooter
src/tests/unit/game-template-catalog.test.ts                    # modifié — ids attendus ["collect", "dodge", "shooter"]
src/tests/unit/generate-game-workflow.test.ts                   # modifié — cas shooter ajouté à validateGameConfig
src/tests/unit/generated-game-schema.test.ts                    # modifié — cas shooter dans l'union

e2e/shooter-play.spec.ts                                        # nouveau — parcours « jouer » dédié shooter (sans mock réseau)
e2e/game-generation-chat.spec.ts                                # modifié — cas shooter généré (mocké) ajouté
```

Aucun fichier sous `src/app/**` n'est modifié (voir §3).

## 8. Style de code

Suivre exactement le style déjà établi par `dodge`/`collect` : classes
d'engine avec état privé mutable réassigné en bloc à chaque `update()`,
`random: () => number` injectable (jamais `Math.random()` en dur — CLAUDE.md
§26), pas de `any`, pas de cast évitable.

```ts
// src/game/templates/shooter/shooter-engine.ts (forme attendue)
export type ShooterEngineState = {
  status: GameStatus;
  player: Vector2;
  health: number;
  enemies: Vector2[];
  projectiles: Vector2[];
  elapsedMs: number;
  score: number;
  killCount: number;
};

export class ShooterEngine {
  private readonly config: ShooterGameConfig;
  private readonly random: () => number;
  private state: ShooterEngineState;
  private msSinceLastEnemySpawn = 0;
  private msSinceLastShot = 0;

  constructor(config: ShooterGameConfig, random: () => number = Math.random) {
    this.config = config;
    this.random = random;
    this.state = this.createInitialState();
  }

  reset(): void {
    /* même motif que DodgeEngine.reset() */
  }
  getState(): ShooterEngineState {
    return this.state;
  }

  update(deltaMs: number, input: InputState): ShooterEngineState {
    if (this.state.status !== "playing") return this.state;
    // 1. déplacement joueur (identique au motif dodge/collect)
    // 2. tir : si input.fire && msSinceLastShot >= fireCooldownMs → spawn projectile
    // 3. avance + filtre projectiles hors écran
    // 4. avance + filtre ennemis hors écran, spawn selon enemySpawnIntervalMs
    // 5. collisions projectile↔ennemi (rectsOverlap) → +score, +killCount
    // 6. collisions ennemi↔joueur (rectsOverlap) → -health, ennemi retiré
    // 7. status: killCount >= targetKillCount → "won" ;
    //    health <= 0 || elapsedMs dépassé → "lost" ; sinon "playing"
  }
}
```

Sprites, sur le modèle exact de `DodgeSprites` :

```ts
// src/game/templates/shooter/shooter-renderer.ts
export type ShooterSprites = {
  player: string;
  enemy: string;
  projectile: string;
};

// src/game/game-controller.ts, dans loadGame(), case "shooter" :
const sprites: ShooterSprites | undefined =
  item.source === "generated"
    ? { player: "🚀", enemy: "👾", projectile: "✨" }
    : undefined;
```

### Schéma Zod — bornes finalisées

```ts
// src/mastra/schemas/shooter-game-config-schema.ts
export const shooterGameConfigSchema = z
  .object({
    ...baseGameConfigShape,
    template: z.literal("shooter"),
    enemyColor: cssColorSchema,
    projectileColor: cssColorSchema,
    enemySpeed: z.number().min(50).max(500),
    enemySpawnIntervalMs: z.number().min(250).max(3000),
    projectileSpeed: z.number().min(100).max(800),
    fireCooldownMs: z.number().min(100).max(2000),
    playerHealth: z.number().int().min(1).max(10),
    targetKillCount: z.number().int().min(3).max(50),
  })
  .strict();
```

Justification de chaque borne (couche schema = forme/bornes simples,
CLAUDE.md §8.1 ; les combinaisons _déraisonnables mais individuellement
valides_ restent du ressort de `shooterPlayabilityRules`, pas du schéma) :

| Champ                  | Bornes       | Rationale                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enemySpeed`           | 50–500 px/s  | Identique à `obstacleSpeed` de `dodge` — même canvas (480×640), même concept d'entité qui traverse l'écran verticalement ; temps de traversée entre 1,3 s (rapide) et 12,8 s (lent), déjà éprouvé par `dodge`.                                                                                                                                             |
| `enemySpawnIntervalMs` | 250–3000 ms  | Identique à `obstacleSpawnIntervalMs` de `dodge` — même logique de fréquence d'apparition, déjà couverte par une règle de playability du même type (`checkObstacleCoverage`/`checkObstaclePressure`, adaptée en `shooterPlayabilityRules`).                                                                                                                |
| `projectileSpeed`      | 100–800 px/s | Même ordre de grandeur que `enemySpeed`, plafond légèrement supérieur car le projectile est l'outil de riposte du joueur ; la borne basse (100) reste volontairement permissive pour laisser `shooterPlayabilityRules` détecter les combinaisons où le projectile est trop lent face à la pression ennemie, plutôt que de l'interdire au niveau du schéma. |
| `fireCooldownMs`       | 100–2000 ms  | Même ordre de grandeur que `collectibleSpawnIntervalMs` de `collect` côté borne basse ; plafond à 2 s pour rester un « jeu occasionnel » (CLAUDE.md §54) — au-delà, le rythme de tir devient trop lent pour rester engageant sur une partie de 10–120 s.                                                                                                   |
| `playerHealth`         | entier 1–10  | Ressource simple et courte, cohérente avec des parties rapides (CLAUDE.md §54) ; `playability` vérifie que la valeur choisie reste crédible face à la pression ennemie plutôt que d'élargir cette borne.                                                                                                                                                   |
| `targetKillCount`      | entier 3–50  | Bornes identiques à `targetCollectibleCount` de `collect` — même logique d'objectif « atteignable en un nombre raisonnable d'occurrences ».                                                                                                                                                                                                                |

## 9. Stratégie de tests

Reprend intégralement la liste CLAUDE.md §9.4 :

**`shooter-engine.test.ts`** :

- état initial valide (`playing`, `health` = `playerHealth`, listes vides) ;
- projectile créé au tir (respecte `fireCooldownMs`, pas de tir avant la fin
  du cooldown) ;
- projectile déplacé (avance selon `projectileSpeed`) ;
- projectile supprimé une fois hors écran ;
- ennemi créé (respecte `enemySpawnIntervalMs`), déplacé, supprimé hors écran ;
- collision projectile/ennemi → ennemi retiré, `score`/`killCount` incrémentés ;
- collision ennemi/joueur → `health` décrémentée, ennemi retiré ;
- `health` à 0 → statut `lost` ;
- `killCount >= targetKillCount` → statut `won` ;
- temps écoulé sans avoir atteint l'objectif → statut `lost` ;
- `reset()` restaure l'état initial (y compris après `won`/`lost`) ;
- plus generiquement : restart répété, `update()` après `won`/`lost` est un
  no-op (comme `DodgeEngine`/`CollectEngine`).

**`shooter-semantic-rules.test.ts`** : cohérence arithmétique pure (pas de
géométrie), motif `checkDuration`/`INSUFFICIENT_SPAWN_TIME` déjà utilisé par
`dodge`/`collect` — ex. le nombre de tirs possibles
(`gameDurationSeconds * 1000 / fireCooldownMs`) doit pouvoir atteindre
`targetKillCount` ; durée anormalement courte/longue.

**`shooter-playability-rules.test.ts`** : simulation physique, motif
`checkObstacleCoverage`/`checkObstaclePressure` de `dodge` adapté — ex.
pression ennemie (vitesse + fréquence de spawn) comparée à la cadence de
tir/dégâts que le joueur peut encaisser avant `health` = 0 ; cas normal sans
issue, cas limite (`warning`), cas manifestement impossible (`error`).

**Tests d'intégration existants à mettre à jour** (pas de nouveau fichier,
extension de la couverture déjà là) :

- `generate-game-workflow.test.ts` — `validateGameConfig` avec un candidat
  shooter valide, un candidat en échec semantic, un candidat en échec
  playability (même structure que les cas dodge/collect déjà présents).
- `generated-game-schema.test.ts` — la config shooter est acceptée par
  `gameConfigSchema` (union discriminée à 3).
- `game-catalog.test.ts` — le catalogue contient bien 3 jeux built-in.
- `game-template-catalog.test.ts` — `shooter` listé, `createEngine` retourne
  bien un `ShooterEngine`.

**E2E dédié shooter** (§12 Question 4 tranchée) :

- `e2e/shooter-play.spec.ts` (nouveau, sans mock réseau, symétrique à
  `game-catalog-play.spec.ts`) :
  - chargement du jeu shooter built-in depuis la sidebar → `#game-title`
    correct, `#game-canvas` visible ;
  - déplacement clavier + tir (Espace) ne lève aucune `pageerror` ;
  - `#restart-button` fonctionne, y compris appelé plusieurs fois de suite ;
  - changer de jeu vers `dodge`/`collect` puis revenir à `shooter` ne casse
    rien.
- `e2e/game-generation-chat.spec.ts` (modifié) : un cas supplémentaire avec
  une fixture `ShooterGameConfig` minimale valide mockée en succès →
  « Tester le jeu » bascule sur la vue jouer avec le titre du jeu shooter
  généré — même structure que le cas dodge déjà présent.

`pnpm typecheck:e2e` doit rester vert.

## 10. Limites

- **Toujours** : borner strictement chaque nouveau champ numérique (Zod
  `.min()`/`.max()`, bornes finalisées en §8) ; injecter `random` dans
  `ShooterEngine` (jamais `Math.random()` en dur) ; garder
  `checkSemantics`/`checkPlayability` déterministes, sans appel au LLM ;
  suivre exactement le pattern de fichiers `dodge`/`collect` (pas de
  nouvelle convention introduite seulement pour `shooter`) ; mocker le
  réseau dans tout scénario e2e de génération (jamais de vrai appel LLM).
- **Demander avant** : changer les bornes globales de `baseGameConfigShape`
  (impacterait aussi `dodge`/`collect`) ; ajouter un champ à `InputState`
  au-delà de `fire` ; changer le format de `docs/current-phase.md`.
- **Jamais** : introduire une abstraction partagée entre les 3 moteurs dans
  cette feature (réservé à PHASE 3) ; accepter un chemin/URL/asset fourni
  par le LLM pour `shooter` (CLAUDE.md §23) ; dépasser le périmètre listé en
  §9.2 de CLAUDE.md avec des champs de config non demandés ; committer un
  `docs/current-phase.md` utilisé comme journal de développement.

## 11. Critères de succès

Repris de CLAUDE.md §9 « Critères de sortie PHASE 2 », complétés par les
décisions de cette itération :

1. Les trois templates (`dodge`, `collect`, `shooter`) fonctionnent.
2. Les trois peuvent être générés depuis le chat (workflow Mastra à 3
   branches explicites, testé).
3. Les trois ont une validation Zod stricte.
4. Les trois ont des playability checks (couche semantic + couche
   playability, comme `dodge`/`collect`).
5. Les trois ont un lifecycle complet (`reset`/`getState`/`update`, no-op
   après `won`/`lost`, intégré au `GameController`, sprites appliqués
   correctement pour les jeux générés).
6. Tests unitaires complets pour `shooter` (§9 ci-dessus, §9.4 CLAUDE.md).
7. `e2e/shooter-play.spec.ts` et le cas shooter de
   `e2e/game-generation-chat.spec.ts` passent, sans régression sur les
   specs `dodge`/`collect` existants.
8. `docs/current-phase.md` existe et déclare `Current phase: PHASE 2` avec
   son objectif et ses critères de sortie (CLAUDE.md §6).
9. Aucune abstraction majeure prématurée (pas de système partagé, pas
   d'ECS, pas de `GameDefinition`).
10. `pnpm check` et `pnpm test:e2e` passent.

## 12. Questions ouvertes — toutes tranchées

1. **`docs/current-phase.md`** : à créer. → **Tranché : oui.**
2. **Trajectoire des ennemis** : verticale descendante, symétrique à
   `dodge`. → **Tranché : confirmé.**
3. **Sprites emoji dédiés** pour la variante générée du shooter. →
   **Tranché : oui** (🚀/👾/✨, voir §8 — ajustables sans impact
   structurel).
4. **Spec e2e dédié**. → **Tranché : oui** (`e2e/shooter-play.spec.ts` +
   cas ajouté à `e2e/game-generation-chat.spec.ts`, voir §9).
5. **Bornes numériques exactes du schéma**. → **Tranché : oui**, finalisées
   en §8 avec justification par champ, plus de valeur provisoire.

Aucune question ouverte restante. Passage à la phase Plan.
