# Spec : PHASE 1 — Infrastructure de tests End-to-End (Playwright)

Statut : **brouillon, en attente de validation humaine avant passage en Plan**

Référence : `CLAUDE.md` §8 (fiabilisation du MVP), §8.2 (cas extrêmes à tester,
notamment restart répété, changement de jeu pendant une partie/`won`/`lost`),
§29.4 (rôle de Playwright : UI, intégration, navigation, absence d'erreur —
pas la physique), §30 (quality gate, `pnpm test:e2e` séparable de
`pnpm check`), §52 (PHASE 1 prioritaire avant PHASE 2 shooter). Complète
`specs/etape-5-connexion-frontend-backend.md`, qui anticipait déjà un spec
`game-generation-chat.spec.ts` mockant le réseau.

## 1. Problème

`@playwright/test` est déjà une devDependency et `package.json` définit
`"test:e2e": "playwright test"`, et le devcontainer installe Chromium pour
Playwright — mais **aucun `playwright.config.ts` et aucun fichier de spec
e2e n'existe dans le repo**. `pnpm test:e2e` échoue donc aujourd'hui
(`Cannot find configuration file`). C'est un trou dans le critère de sortie
PHASE 1 « Playwright essentiel passe » (§8, critères de sortie).

Le frontend (`public/index.html` + `public/dist/**`, servi par le seul
processus Mastra sur le port 4111 — voir `specs/etape-5-connexion-frontend-backend.md`)
n'a donc aujourd'hui aucune couverture de bout en bout : le catalogue de
jeux (`dodge-game`, `collect-game`), le cycle de vie du `GameController`
(start/restart/changement de jeu), et le flux de génération par chat
(`chat-panel.ts` → `chat-service.ts` → `POST /api/games/generate`) ne sont
vérifiés qu'unitairement (Vitest, sur la logique pure), jamais dans un vrai
navigateur.

## 2. Objectif

Ajouter l'infrastructure Playwright manquante et une première couverture
e2e « essentielle » couvrant les parcours critiques listés à §8.2 et
observables uniquement en intégration réelle (navigation, DOM, canvas,
requêtes réseau) :

1. `playwright.config.ts` fonctionnel, qui démarre le vrai serveur Mastra
   (même origine sert page + API, comme en prod/dev) et exécute les specs
   contre lui.
2. Un premier spec couvrant le parcours « jouer » : chargement du jeu par
   défaut, changement de jeu, restart, restart répété.
3. Un second spec couvrant le parcours « créer par chat », réseau mocké
   (jamais d'appel LLM réel dans les tests), succès et échec.
4. `pnpm test:e2e` passe en local et est exécutable en CI sans secret
   (aucune clé API requise).

## 3. Non-objectifs (explicitement hors périmètre)

- Tester la physique du jeu (collisions précises, trajectoires) en
  Playwright — déjà couvert par les tests unitaires `dodge-engine.test.ts` /
  `collect-engine.test.ts` (§29.4 : « éviter de tester toute la physique
  avec Playwright »).
- Appeler un vrai modèle LLM depuis un test e2e (coût, non-déterminisme,
  §25 « runtime indépendant du réseau » côté test).
- Multi-navigateur (Firefox/WebKit) : le devcontainer n'installe que
  Chromium (`setup.sh`) ; rester sur un seul projet Playwright pour
  l'instant.
- Ajouter des specs e2e pour PHASE 2 (`shooter`), qui n'existe pas encore.
- Intégrer `pnpm test:e2e` dans `pnpm check` (CLAUDE.md §30 autorise
  explicitement à les garder séparés vu leur coût).
- Mettre en place un pipeline CI (GitHub Actions, etc.) — hors périmètre
  tant qu'aucun CI n'existe déjà dans le repo (à vérifier, mais aucun
  `.github/workflows` trouvé lors de l'exploration).

## 4. Hypothèses posées (à corriger maintenant si besoin)

1. **Emplacement des specs : `e2e/` à la racine**, pas sous `src/`. Raison :
   `tsconfig.json` a `rootDir: "src"` et `include: ["src"]` — des specs sous
   `src/tests/e2e` seraient compilées par `tsc` dans `public/dist` (donc
   servies publiquement) et risqueraient de casser le build. `vitest.config.ts`
   n'inclut que `src/**/*.test.ts`, donc des fichiers `*.spec.ts` sous `e2e/`
   ne seront jamais ramassés par Vitest par erreur. `eslint.config.ts` a
   `files: ["**/*.ts"]` sans restriction à `src/`, donc `e2e/**` sera déjà
   linté par `pnpm lint` sans changement de config.
2. **Le serveur e2e est le vrai serveur Mastra**, pas un mock statique :
   `webServer` dans `playwright.config.ts` lance `pnpm dev` (= `pnpm build &&
mastra dev`, déjà single-origin page+API — voir
   `specs/etape-5-connexion-frontend-backend.md`) sur `http://localhost:4111`,
   avec `reuseExistingServer: !process.env.CI` pour ne pas doubler le serveur
   pendant le développement local.
3. **Aucun secret requis pour lancer les tests.** `gameDesignerAgent` prend
   `model` comme simple chaîne (`src/mastra/agents/game-designer-agent.ts`) —
   la clé API n'est résolue que lors d'un appel réel au modèle. Comme tout
   test touchant `/api/games/generate` mock la requête côté client avec
   `page.route(...)` (jamais `route.continue()` vers le vrai backend), le
   serveur démarre et sert le frontend sans `GOOGLE_GENERATIVE_AI_API_KEY`
   ni `ANTHROPIC_API_KEY` positionnées.
4. **Deux fichiers de spec seulement pour cette itération**, correspondant
   directement aux cas §8.2 observables en UI :
   - `e2e/game-catalog-play.spec.ts` : jeu par défaut chargé (`dodge-game`),
     changement de jeu (`collect-game`) depuis la sidebar, restart, restart
     répété, retour à la vue « jouer ».
   - `e2e/game-generation-chat.spec.ts` : soumission d'un prompt avec
     `/api/games/generate` mocké en succès → état de progression affiché →
     jeu ajouté au catalogue → « Tester le jeu » bascule sur la vue jouer ;
     et un cas mocké en échec (`success:false`) → message d'erreur affiché
     dans le chat, sans jeu ajouté.
     D'autres cas de §8.2 (ex. « erreur Mastra », « configuration invalide »)
     restent couverts au niveau unitaire (`generate-game-route.test.ts`,
     `generate-game-workflow.test.ts`) — Playwright ne duplique pas cette
     couverture, il vérifie seulement que l'UI réagit correctement à ce que
     l'API renvoie.
5. **Typecheck de `e2e/`** : ajouter `e2e/tsconfig.json` dédié (étend
   `tsconfig.json`, `noEmit`, `include: ["."]`, sans `rootDir`/`outDir`
   hérités du build applicatif) + script `"typecheck:e2e": "tsc -p
e2e/tsconfig.json --noEmit"`, exécuté manuellement / en CI e2e mais
   **pas** ajouté à `pnpm check` (cohérent avec l'hypothèse ci-dessus sur
   §30).
6. **Pas de nouvelle dépendance** : `@playwright/test` est déjà présent ;
   `playwright install chromium` est déjà fait par `.devcontainer/setup.sh`.

## 5. Stack technique

Inchangée, rien n'est ajouté :

- `@playwright/test` ^1.62.1 (déjà en devDependency).
- Chromium (déjà installé par `.devcontainer/setup.sh`).
- Serveur cible : le processus Mastra existant (`src/mastra/index.ts`),
  démarré via `pnpm dev`.

## 6. Commandes

```bash
pnpm test:e2e              # déjà défini : playwright test
pnpm exec playwright test --ui   # mode debug local (pas de nouveau script requis)
pnpm typecheck:e2e         # nouveau — tsc --noEmit sur e2e/
```

`pnpm check` (typecheck && lint && test && build) **n'est pas modifié**.

## 7. Structure du projet (fichiers concernés)

```
playwright.config.ts          # nouveau — racine du repo
e2e/
├── tsconfig.json              # nouveau — typecheck dédié, pas de build
├── game-catalog-play.spec.ts       # nouveau
└── game-generation-chat.spec.ts    # nouveau
package.json                  # modifié — script "typecheck:e2e"
.gitignore                    # déjà présent : test-results/, playwright-report/
```

## 8. Style de code

Suivre le style déjà établi (unions discriminées, pas de `any`, pas de
cast évitable). Exemple de forme attendue pour le mock réseau, cohérent
avec `GenerateGameResponse` (`src/mastra/schemas/generate-game-api-schema.ts`) :

```ts
import { test, expect } from "@playwright/test";

test("un prompt valide génère un jeu testable", async ({ page }) => {
  await page.route("**/api/games/generate", async (route) => {
    await route.fulfill({
      json: {
        success: true,
        result: { game: /* GameCatalogItem minimal valide */ },
      },
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /créer un jeu/i }).click();
  await page.getByRole("textbox").fill("Un jeu où j'évite des météorites");
  await page.getByRole("button", { name: /envoyer/i }).click();

  await expect(page.getByRole("button", { name: /tester le jeu/i })).toBeEnabled();
});
```

Sélecteurs préférés, par ordre : rôle accessible / texte visible d'abord ;
`page.locator("#id-css")` seulement si aucun rôle/texte n'identifie
l'élément de façon unique dans `public/index.html`.

## 9. Stratégie de tests

- **`e2e/game-catalog-play.spec.ts`** (réseau réel non pertinent, pas de
  mock nécessaire — aucune requête `/api/games/generate` déclenchée par ce
  parcours) :
  - au chargement de `/`, le jeu par défaut (`dodge-game`) est actif et le
    canvas est visible ;
  - cliquer sur `collect-game` dans la sidebar bascule le jeu actif (titre
    affiché change) ;
  - le bouton restart réinitialise le score/statut affiché, y compris
    appelé plusieurs fois de suite (restart répété, §8.2) ;
  - changer de jeu pendant une partie en cours ne casse pas l'UI (pas
    d'exception non gérée — vérifié via l'absence d'événement `pageerror`).
- **`e2e/game-generation-chat.spec.ts`** (réseau mocké via `page.route`,
  jamais de vrai appel modèle) :
  - cas succès : progression affichée, résultat affiché, « Tester le jeu »
    active la vue jouer avec le jeu généré ;
  - cas échec (`success:false`, code d'erreur métier) : message d'erreur
    lisible affiché dans le chat, aucun jeu ajouté au catalogue, pas
    d'exception JS non gérée.
- Aucun nouveau test Vitest requis par cette tâche — l'infrastructure e2e
  est additive.

## 10. Limites

- **Toujours** : mocker `/api/games/generate` dans tout spec e2e qui
  déclenche une génération (jamais de vrai appel LLM payant/non
  déterministe, §25) ; garder les specs sous `e2e/` (pas `src/`) ; garder
  Chromium comme unique projet Playwright tant qu'aucun besoin
  multi-navigateur n'est démontré.
- **Demander avant** : ajouter un pipeline CI (GitHub Actions) pour
  exécuter ces tests automatiquement ; ajouter `pnpm test:e2e` à
  `pnpm check` ; ajouter un second navigateur ; installer un serveur de
  test statique séparé du serveur Mastra réel.
- **Jamais** : faire dépendre un test e2e d'une clé API réelle ; committer
  des captures/traces Playwright contenant des données sensibles (déjà
  ignoré par `.gitignore` : `test-results/`, `playwright-report/`).

## 11. Critères de succès

1. `pnpm test:e2e` s'exécute sans erreur de configuration et les deux
   specs passent en local, sans variable d'environnement/secret positionné.
2. Aucun test e2e ne dépend d'un appel réseau réel vers un fournisseur de
   modèle.
3. `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` restent tous
   verts (comportement applicatif inchangé).
4. `pnpm typecheck:e2e` passe (TypeScript strict respecté sous `e2e/`).
5. Les critères de sortie PHASE 1 §8 gagnent leur brique manquante
   « Playwright essentiel passe ».

## 12. Questions ouvertes

1. Faut-il aussi committer les résultats/traces de la première exécution
   locale (screenshots à l'échec) ou rester strictement sur les valeurs
   déjà ignorées par `.gitignore` ? Proposition : rester sur l'existant,
   rien à committer.
2. `docs/current-phase.md` n'existe pas encore dans le repo alors que
   CLAUDE.md §6 le mentionne comme optionnel (« créer si nécessaire »).
   Cette tâche ne le crée pas (hors périmètre de la demande) — à confirmer
   que ce n'est pas attendu ici.
