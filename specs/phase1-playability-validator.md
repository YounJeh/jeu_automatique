# Spec : PHASE 1 — Architecture du PlayabilityValidator

Statut : **brouillon, en attente de validation humaine avant passage en Plan**

Référence : `CLAUDE.md` §8.1 (trois niveaux de validation), §8.4 (lifecycle,
hors périmètre ici), §28 (codes d'erreur), §41 (pas d'ECS sans besoin), §52
(priorité PHASE 1 avant PHASE 2 shooter).

## 1. Problème

Le code actuel valide déjà les configurations de jeu à deux niveaux, mais ils
sont mélangés :

- **Schema validation (Zod)** : correcte et déjà bien séparée
  (`src/mastra/schemas/*-game-config-schema.ts`).
- **Playability validation** : existe (`checkPlayability` sur
  `GameTemplateDefinition`, implémentée dans `dodge-template.ts` /
  `collect-template.ts`, types partagés dans
  `src/game/templates/playability.ts`) mais **regroupe deux
  responsabilités différentes sous un seul nom** :
  - des vérifications de **cohérence arithmétique pure** entre champs
    déclarés (ex. `UNUSUAL_GAME_DURATION`, `INSUFFICIENT_SPAWN_TIME`,
    `TIGHT_COLLECTION_WINDOW`, `TRIVIAL_OBJECTIVE`) — aucune notion de
    geometrie ni de vitesse de déplacement réelle du joueur ;
  - des vérifications qui **simulent la capacité physique du joueur**
    dans le monde (dimensions du canvas, vitesse, temps de trajet) — ex.
    `OBSTACLES_COVER_SCREEN`, `EXCESSIVE_OBSTACLE_PRESSURE`,
    `TARGET_UNREACHABLE_FOR_PLAYER_SPEED`, `SLOW_PLAYER_VS_SPAWN_RATE`.

CLAUDE.md §8.1 exige que ces deux responsabilités soient des couches
**distinctes** (semantic validation ≠ playability validation), chacune
testable indépendamment. Ce n'est pas le cas aujourd'hui : tout vit dans
une seule fonction `checkXxxPlayability` par template, avec un seul type de
rapport (`PlayabilityReport`).

Par ailleurs, rien ne prépare l'extension à un troisième template
(`shooter`, PHASE 2) sans dupliquer le patron actuel (une fonction
monolithique par template, non composée à partir de règles réutilisables).

## 2. Objectifs

1. Séparer explicitement **semantic validation** et **playability
   validation** en deux modules indépendants, chacun indépendant de Zod.
2. Reclasser les règles existantes de `dodge` et `collect` dans la bonne
   couche, sans changer leur comportement observable (mêmes codes, mêmes
   sévérités, mêmes messages).
3. Définir un patron **basé sur des règles composables** (liste de
   fonctions pures `(config) => Issue | null`) plutôt qu'une fonction
   monolithique par template, pour que l'ajout de `shooter` en PHASE 2 ne
   nécessite que de nouveaux fichiers, jamais de modification de
   `dodge`/`collect`.
4. Garder l'API publique actuelle utilisée par les tests et le workflow
   (`GameTemplateDefinition.checkPlayability(config)`) fonctionnelle, en
   ajoutant l'équivalent pour la couche sémantique
   (`checkSemantics(config)`).
5. Faire en sorte que le workflow Mastra puisse enchaîner
   schema → semantic → playability, chaque étape pouvant bloquer la
   génération indépendamment.

## 3. Non-objectifs (explicitement hors périmètre)

- Implémenter `shooter` ou son schéma (PHASE 2).
- Simulation headless / Monte-Carlo / métriques de winrate (PHASE 8).
- Modifier les bornes ou règles Zod existantes.
- Changer le comportement utilisateur final (aucun message ni blocage
  nouveau côté chat/UI).
- Introduire un DSL de règles générique ou un `GameDefinition`
  (PHASE 4/5) — le registre de règles proposé ici reste local à
  `dodge`/`collect`/`shooter`, pas un système générique piloté par
  données.
- Ajouter une dépendance (§40) — tout reste en TypeScript pur.
- Écrire du code d'implémentation : cette étape ne produit qu'une
  architecture et des interfaces à valider avant le PLAN.

## 4. Hypothèses posées (à corriger maintenant si besoin)

1. **Critère de classification retenu** : une règle est _semantic_ si
   elle compare uniquement des champs numériques déclarés entre eux
   (arithmétique fermée, ex. `count × interval` vs `duration`) ; elle est
   _playability_ si elle nécessite une donnée géométrique du monde
   (largeur/hauteur du canvas, taille d'entité) ou un raisonnement sur le
   temps de réaction/déplacement du joueur. Voir tableau §6.3.
2. Reclasser des codes existants d'une couche à l'autre est acceptable en
   PHASE 1 tant que le comportement de blocage final (le workflow refuse
   toujours les mêmes configurations) est préservé — le workflow devra
   donc faire échouer la génération sur une erreur _semantic_ **ou**
   _playability_, pas seulement _playability_ comme aujourd'hui.
3. `GameTemplateDefinition` peut gagner une méthode (`checkSemantics`)
   sans casser de contrat existant, puisque c'est une interface interne
   au repo (pas une API publique versionnée).
4. L'alignement des codes d'erreur (`GameGenerationErrorCode`) sur
   `SCHEMA_VALIDATION_FAILED` / `SEMANTIC_VALIDATION_FAILED` /
   `PLAYABILITY_VALIDATION_FAILED` (§28 CLAUDE.md) fait partie du
   périmètre, car c'est le seul moyen d'observer réellement trois couches
   distinctes de bout en bout (sinon les trois couches existent en
   interne mais restent invisibles derrière un seul `VALIDATION_FAILED`).
   Dites-moi si vous préférez le garder pour une étape séparée.

## 5. Architecture proposée

### 5.1 Vue d'ensemble

```text
                     ┌────────────────────────┐
config: unknown ───▶ │  Zod schema (existant)  │  forme, types, bornes
                     └───────────┬─────────────┘
                                 │ TConfig (typé, déjà valide)
                                 ▼
                     ┌────────────────────────┐
                     │   SemanticValidator     │  cohérence arithmétique
                     │  src/game/validation/   │  entre champs déclarés
                     │      semantic/          │
                     └───────────┬─────────────┘
                                 │ TConfig (inchangé)
                                 ▼
                     ┌────────────────────────┐
                     │  PlayabilityValidator   │  capacité physique du
                     │  src/game/validation/   │  joueur (géométrie,
                     │     playability/        │  vitesse, timing)
                     └───────────┬─────────────┘
                                 │
                                 ▼
                          jeu jouable / rejeté
```

Les deux nouvelles couches vivent dans `src/game/validation/`, aux côtés
de (et sans dépendre de) `src/game/templates/`. Aucune des deux ne dépend
de Zod ni de Mastra — elles ne prennent en entrée que des objets déjà
typés (`DodgeGameConfig`, `CollectGameConfig`, futur `ShooterGameConfig`).

### 5.2 Patron « règles composables »

Chaque couche partage le même patron générique : une liste de règles
pures, combinées par un runner générique.

```text
src/game/validation/
├── types.ts                          # ValidationIssue (type partagé)
├── semantic/
│   ├── semantic-validator.ts         # SemanticRule, SemanticValidator, createSemanticValidator
│   ├── dodge-semantic-rules.ts       # règles dodge (UNUSUAL_GAME_DURATION)
│   └── collect-semantic-rules.ts     # règles collect (INSUFFICIENT_SPAWN_TIME, TIGHT_COLLECTION_WINDOW, TRIVIAL_OBJECTIVE)
├── playability/
│   ├── playability-validator.ts      # PlayabilityRule, PlayabilityValidator, createPlayabilityValidator
│   ├── dodge-playability-rules.ts    # règles dodge (OBSTACLES_COVER_SCREEN, EXCESSIVE_OBSTACLE_PRESSURE)
│   └── collect-playability-rules.ts  # règles collect (TARGET_UNREACHABLE_FOR_PLAYER_SPEED, SLOW_PLAYER_VS_SPAWN_RATE)
└── registry.ts                       # un point d'entrée par template, pour le workflow
```

Chaque fichier `*-rules.ts` exporte uniquement un tableau de fonctions
pures `(config) => ValidationIssue | null`, dans le même style que les
fonctions `checkXxx` déjà présentes aujourd'hui — la migration est donc
majoritairement un déplacement de code, pas une réécriture.

### 5.3 Extension à `shooter` (PHASE 2, à titre d'illustration seulement)

Sans toucher un seul fichier `dodge-*` ou `collect-*`, `shooter` ajoute :

```text
src/game/validation/semantic/shooter-semantic-rules.ts
src/game/validation/playability/shooter-playability-rules.ts
```

et une entrée dans `registry.ts`. C'est le critère d'extensibilité
demandé.

### 5.4 Où branche-t-on ça ?

- `GameTemplateDefinition` (interface existante) gagne une méthode
  `checkSemantics`, symétrique à `checkPlayability`. Chaque
  `xxx-template.ts` délègue aux validateurs de
  `src/game/validation/semantic/` et `.../playability/` au lieu
  d'implémenter ses propres fonctions `checkXxx` inline.
- `registry.ts` expose un objet `{ dodge: {...}, collect: {...} }`
  (clé = `GameTemplate`) que le workflow peut interroger sans connaître
  le détail de chaque template — c'est ce qui permettra, en PHASE 2,
  d'itérer plutôt que de brancher explicitement `if (template === ...)`.
- `generate-game-workflow.ts::validateAndCheckPlayability` devient (au
  niveau conception, pas de code ici) une séquence
  `schema.safeParse → semantic.validate → playability.validate`, chacune
  pouvant lever une `GameGenerationError` avec un code distinct.

## 6. Interfaces TypeScript (conception, pas d'implémentation)

### 6.1 Types partagés

```ts
// src/game/validation/types.ts
export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  severity: ValidationSeverity;
  code: string;
  message: string;
};
```

### 6.2 Couche sémantique

```ts
// src/game/validation/semantic/semantic-validator.ts
import type { ValidationIssue } from "../types.js";

export type SemanticReport = {
  valid: boolean;
  issues: ValidationIssue[];
};

export type SemanticRule<TConfig> = (config: TConfig) => ValidationIssue | null;

export interface SemanticValidator<TConfig> {
  readonly rules: readonly SemanticRule<TConfig>[];
  validate(config: TConfig): SemanticReport;
}

export function createSemanticValidator<TConfig>(
  rules: readonly SemanticRule<TConfig>[],
): SemanticValidator<TConfig>;
```

### 6.3 Couche playability

```ts
// src/game/validation/playability/playability-validator.ts
import type { ValidationIssue } from "../types.js";

export type PlayabilityReport = {
  playable: boolean;
  issues: ValidationIssue[];
};

export type PlayabilityRule<TConfig> = (
  config: TConfig,
) => ValidationIssue | null;

export interface PlayabilityValidator<TConfig> {
  readonly rules: readonly PlayabilityRule<TConfig>[];
  validate(config: TConfig): PlayabilityReport;
}

export function createPlayabilityValidator<TConfig>(
  rules: readonly PlayabilityRule<TConfig>[],
): PlayabilityValidator<TConfig>;
```

`SemanticReport.valid` et `PlayabilityReport.playable` restent deux noms
de champ distincts et parlants (pas de type générique commun forcé) —
cohérent avec CLAUDE.md §27 (préférer des types métier explicites à une
abstraction prématurée).

### 6.4 Registre par template

```ts
// src/game/validation/registry.ts
import type { DodgeGameConfig } from "../../mastra/schemas/dodge-game-config-schema.js";
import type { CollectGameConfig } from "../../mastra/schemas/collect-game-config-schema.js";
import type { SemanticValidator } from "./semantic/semantic-validator.js";
import type { PlayabilityValidator } from "./playability/playability-validator.js";

export type TemplateValidators<TConfig> = {
  semantic: SemanticValidator<TConfig>;
  playability: PlayabilityValidator<TConfig>;
};

export type ValidationRegistry = {
  dodge: TemplateValidators<DodgeGameConfig>;
  collect: TemplateValidators<CollectGameConfig>;
  // shooter: TemplateValidators<ShooterGameConfig>;  // ajouté en PHASE 2
};
```

### 6.5 `GameTemplateDefinition` (modification)

```ts
// src/game/templates/game-template-definition.ts
export interface GameTemplateDefinition<TConfig, TEngine> {
  readonly id: GameTemplate;
  readonly description: string;
  readonly defaultConfig: TConfig;
  readonly configSchema: z.ZodType<TConfig>;
  createEngine(config: TConfig, random?: () => number): TEngine;
  checkSemantics(config: TConfig): SemanticReport; // nouveau
  checkPlayability(config: TConfig): PlayabilityReport; // signature inchangée
}
```

### 6.6 Codes d'erreur (si l'hypothèse §4.4 est validée)

```ts
// src/mastra/errors/game-generation-error.ts
export type GameGenerationErrorCode =
  | "INVALID_PROMPT"
  | "MODEL_UNAVAILABLE"
  | "INVALID_MODEL_OUTPUT"
  | "UNSUPPORTED_TEMPLATE"
  | "SCHEMA_VALIDATION_FAILED" // remplace VALIDATION_FAILED (schéma Zod)
  | "SEMANTIC_VALIDATION_FAILED" // nouveau
  | "PLAYABILITY_VALIDATION_FAILED" // nouveau
  | "SAVE_FAILED"
  | "GAME_INITIALIZATION_FAILED";
```

## 7. Reclassification des règles existantes

| Code                                  | Template | Couche actuelle | Couche proposée | Justification                                             |
| ------------------------------------- | -------- | --------------- | --------------- | --------------------------------------------------------- |
| `UNUSUAL_GAME_DURATION`               | dodge    | playability     | **semantic**    | borne relative sur un seul champ, aucune géométrie        |
| `OBSTACLES_COVER_SCREEN`              | dodge    | playability     | **playability** | dépend de la largeur du canvas et de la taille d'obstacle |
| `EXCESSIVE_OBSTACLE_PRESSURE`         | dodge    | playability     | **playability** | dépend de la vitesse du joueur vs temps de réapparition   |
| `INSUFFICIENT_SPAWN_TIME`             | collect  | playability     | **semantic**    | arithmétique pure : `count × interval` vs `duration`      |
| `TIGHT_COLLECTION_WINDOW`             | collect  | playability     | **semantic**    | même famille arithmétique                                 |
| `TARGET_UNREACHABLE_FOR_PLAYER_SPEED` | collect  | playability     | **playability** | dépend de la diagonale du canvas et de la vitesse joueur  |
| `SLOW_PLAYER_VS_SPAWN_RATE`           | collect  | playability     | **playability** | dépend de la largeur du canvas et de la vitesse joueur    |
| `TRIVIAL_OBJECTIVE`                   | collect  | playability     | **semantic**    | arithmétique pure sur count/interval/duration             |

Aucun code, message ni sévérité ne change — seule la couche qui le
calcule change. Le workflow doit donc bloquer sur une erreur trouvée
_soit_ en semantic _soit_ en playability pour ne régresser sur aucun cas
actuellement rejeté.

## 8. Fichiers à modifier

**Nouveaux fichiers :**

- `src/game/validation/types.ts`
- `src/game/validation/semantic/semantic-validator.ts`
- `src/game/validation/semantic/dodge-semantic-rules.ts`
- `src/game/validation/semantic/collect-semantic-rules.ts`
- `src/game/validation/playability/playability-validator.ts`
- `src/game/validation/playability/dodge-playability-rules.ts`
- `src/game/validation/playability/collect-playability-rules.ts`
- `src/game/validation/registry.ts`
- `src/tests/unit/semantic-validation.test.ts`

**Fichiers modifiés :**

- `src/game/templates/game-template-definition.ts` — ajout de `checkSemantics`
- `src/game/templates/dodge/dodge-template.ts` — délègue aux nouveaux modules, supprime les fonctions `checkXxx` inline
- `src/game/templates/collect/collect-template.ts` — idem
- `src/mastra/workflows/generate-game-workflow.ts` — `validateAndCheckPlayability` devient une séquence schema → semantic → playability
- `src/mastra/errors/game-generation-error.ts` — nouveaux codes (si hypothèse §4.4 validée)
- `src/tests/unit/playability.test.ts` — ne garde que les assertions sur les codes réellement playability (table §7) ; les codes reclassés migrent vers `semantic-validation.test.ts`

**Fichier supprimé (après migration) :**

- `src/game/templates/playability.ts` — remplacé par `src/game/validation/types.ts` + `src/game/validation/playability/playability-validator.ts`

## 9. Critères d'acceptation

1. `src/game/validation/semantic/` et `src/game/validation/playability/`
   n'importent ni l'un l'autre, ni Zod, ni Mastra — seulement les types de
   config (`DodgeGameConfig`, `CollectGameConfig`) et
   `src/game/validation/types.ts`.
2. `dodgeTemplateDefinition.checkPlayability(...)` et
   `collectTemplateDefinition.checkPlayability(...)` continuent de
   retourner exactement les mêmes codes/sévérités qu'aujourd'hui pour les
   configurations déjà couvertes par `playability.test.ts` (après
   reclassification, additionnés à `checkSemantics(...)`).
3. Chaque règle reclassée en semantic (table §7) est testée dans
   `semantic-validation.test.ts` avec au moins un cas passant et un cas
   bloquant, à l'identique des tests actuels.
4. Le workflow (`generate-game-workflow.ts`) rejette une configuration si
   _soit_ `checkSemantics`, _soit_ `checkPlayability` retourne une
   `error` — aucune régression sur les cas déjà bloqués aujourd'hui
   (ex. `INSUFFICIENT_SPAWN_TIME` doit toujours faire échouer la
   génération, même s'il est désormais détecté en semantic).
5. Ajouter `shooter` ne nécessite de modifier aucun fichier
   `dodge-*`/`collect-*` existant — uniquement de nouveaux fichiers
   `shooter-*-rules.ts` + une entrée dans `registry.ts` (vérifié par
   relecture, pas par test automatisé tant que shooter n'existe pas).
6. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` passent après
   implémentation.
7. Aucune nouvelle dépendance npm ajoutée.
8. Aucune logique dépendant d'un LLM dans `src/game/validation/`.

## 10. Risques

- **Régression silencieuse de blocage** : si le workflow n'enchaîne pas
  correctement semantic _et_ playability (ou n'agrège pas les erreurs des
  deux), une configuration aujourd'hui rejetée (ex.
  `INSUFFICIENT_SPAWN_TIME`, actuellement en playability) pourrait
  devenir acceptée par erreur après la migration. Mitigation : critère
  d'acceptation §9.4 + tests de non-régression avant suppression de
  l'ancien `checkCollectPlayability`.
- **Ambiguïté de classification** : certaines règles futures (notamment
  pour `shooter` : dégâts, points de vie) pourraient ne pas correspondre
  clairement au critère « arithmétique pure vs géométrie/vitesse » du
  §4.1. Mitigation : documenter la règle de classification en commentaire
  dans `semantic-validator.ts`/`playability-validator.ts`, trancher au
  cas par cas en PLAN pour shooter.
- **Portée des codes d'erreur (§4.4)** : étendre
  `GameGenerationErrorCode` touche `generate-game-route.ts` et ses tests
  (`generate-game-route.test.ts`) au-delà du périmètre strict
  « validation ». Si jugé trop large, cette partie peut être reportée à
  une tâche séparée sans bloquer le reste — à trancher avant le PLAN.
- **Interface `GameTemplateDefinition` élargie** : ajouter
  `checkSemantics` est un changement d'interface ; tout code construisant
  un objet `GameTemplateDefinition` sans cette méthode casse au
  typecheck. Risque faible (deux implémentations seulement aujourd'hui),
  mais à vérifier explicitement en BUILD.
- **`docs/current-phase.md` n'existe pas encore** (CLAUDE.md §6 le
  demande). Hors périmètre de cette spec, mais à créer séparément pour
  documenter explicitement que PHASE 1 est active — signalé ici pour
  ne pas l'oublier.

## 11. Prochaine étape

En attente de validation humaine sur : le critère de classification
(§4.1), l'inclusion des codes d'erreur (§4.4), et la suppression de
`src/game/templates/playability.ts` (§8). Une fois validé → passage en
Phase PLAN (`tasks/plan.md` + `tasks/todo.md`), qui découpera ceci en
tâches atomiques suivant `git-workflow-and-versioning` (§50 CLAUDE.md :
un commit par tâche atomique).
