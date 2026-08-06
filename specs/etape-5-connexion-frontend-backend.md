# Spec : Étape 5 — Connexion frontend/backend

Statut : **brouillon, en attente de validation humaine avant passage en Plan**

Référence : `CLAUDE.md` §20 (API), §31 étape 5, §9 (chat), §19 (états), §28 (erreurs).

## Objectif

Aujourd'hui, `src/app/services/chat-service.ts` simule entièrement la génération de jeu
dans le navigateur (sélection de template par mots-clés, config construite à partir des
valeurs par défaut, validation Zod + jouabilité locales). L'étape 4 a construit un vrai
backend Mastra (`gameDesignerAgent` + `generateGameWorkflow`, `src/mastra/index.ts`) qui
fait ce travail pour de vrai, avec un LLM réel, et persiste le résultat dans
`public/generated-games/generated-games.json`.

L'étape 5 remplace le mock par un vrai appel réseau vers ce backend, sans changer le
contrat observable par le reste de l'UI (`chat-panel.ts` ne doit pas avoir besoin de
changer). Utilisateur final : la même personne qu'aujourd'hui, dans le panneau « Créer
un jeu ». Succès = elle décrit un jeu, voit une progression, et peut tester un jeu
_réellement généré par le modèle_ (pas un jeu par défaut recoloré).

## Hypothèses posées (à corriger maintenant si besoin)

Deux décisions structurantes ont déjà été validées avec l'utilisateur :

1. **Un seul processus Mastra sert le frontend ET l'API.** Plus de `python3 -m
http.server` séparé ; `mastra dev` (local) / le serveur Mastra buildé
   (déploiement) sert `public/index.html` + `public/dist/*` en plus de
   `POST /api/games/generate`. Même origine, zéro CORS, zéro détection d'URL par
   environnement (Codespaces inclus). `start.sh` change en conséquence.
2. **Progression simulée côté client, pas de streaming.** Un seul
   `fetch("/api/games/generate")` qui attend la réponse complète ; le frontend
   avance les libellés `analyzing → generating → validating → saving → ready`
   à intervalles, comme le mock le fait déjà. Le streaming réel (via
   `run.stream()` du workflow) est explicitement hors périmètre de cette étape.

Hypothèses additionnelles, plus réversibles — à corriger si elles ne conviennent pas :

3. Le catalogue navigateur (`src/game/catalog/game-catalog.ts`, en mémoire,
   remis à zéro à chaque rechargement) **n'est pas fusionné** avec
   `generated-games.json` (le fichier serveur reste un journal de durabilité/audit
   côté serveur). Le jeu généré est ajouté au catalogue navigateur directement à
   partir du corps de la réponse HTTP (`GeneratedGameResult.game`), exactement
   comme `game-catalog-service.ts::saveGeneratedGame()` le fait déjà aujourd'hui
   avec le résultat mocké. Conséquence acceptée : les jeux générés ne survivent
   pas à un rechargement de page côté navigateur (déjà le cas aujourd'hui).
4. `POST /api/games/generate` répond toujours **HTTP 200** avec l'enveloppe
   `GenerateGameResponse` de CLAUDE.md §20 (`{ success, result?, error? }`),
   y compris pour les échecs « métier » (`INVALID_PROMPT`, `VALIDATION_FAILED`,
   etc., portés par `GameGenerationError`). Un statut HTTP non-2xx ou une
   exception réseau signifie une panne de transport (serveur injoignable, crash
   non géré) et est mappée côté client sur un message générique.
5. `chat-service.ts::generateGameFromPrompt(prompt, onProgress?, stepDelayMs?)`
   garde exactement sa signature et son type de retour
   (`Promise<GeneratedGameResult>`) ; seule son implémentation interne change
   (fetch au lieu du mock). `selectTemplateFromPrompt`, `buildGameConfigFromPrompt`
   et la validation locale (dans `chat-service.ts`) deviennent obsolètes et sont
   supprimées — cette responsabilité vit maintenant entièrement dans le workflow.
6. Aucune nouvelle dépendance frontend : `fetch` natif, pas de client HTTP tiers.
7. Le mécanisme exact par lequel Mastra sert le frontend statique (convention
   `src/mastra/public/`, vs. une route catch-all `registerApiRoute`) n'est **pas**
   encore tranché — voir Questions ouvertes. Le principe (un seul processus) est
   acquis ; le détail de branchement est à confirmer en phase Plan.

## Stack technique

Inchangée par rapport à l'étape 4, sans ajout :

- Frontend : TypeScript compilé par `tsc` (pas de bundler), `fetch` natif, aucun
  framework UI.
- Backend : `@mastra/core` (`Mastra`, `registerApiRoute` depuis
  `@mastra/core/server`), `generateGameWorkflow` et `gameDesignerAgent` déjà
  construits à l'étape 4.
- Validation : Zod, déjà en place (`gameConfigSchema`, `generatedGameResultSchema`).

## Commandes

```bash
pnpm build       # tsc + vendor-zod (inchangé) ; produit ce que Mastra doit servir
pnpm dev         # mastra dev — sert désormais le frontend ET l'API sur un seul port
pnpm test        # vitest run
pnpm typecheck   # tsc --noEmit
pnpm check       # typecheck && test && build
```

`start.sh` est mis à jour pour ne plus lancer de serveur statique séparé (détail exact
en phase Plan, dépend de la question ouverte n°1).

## Structure du projet (fichiers concernés)

```
src/
├── mastra/
│   ├── index.ts                          # existant — server.apiRoutes ajouté ici
│   ├── server/
│   │   └── generate-game-route.ts        # nouveau — POST /api/games/generate
│   └── workflows/generate-game-workflow.ts  # existant, réutilisé tel quel
├── app/
│   ├── services/
│   │   └── chat-service.ts               # modifié — fetch au lieu du mock
│   │   └── game-catalog-service.ts       # inchangé, réutilisé tel quel
│   └── components/chat-panel.ts          # inchangé si le contrat de chat-service
│                                          #   est bien préservé
└── tests/unit/
    ├── chat-service.test.ts              # modifié — mock global.fetch
    └── generate-game-route.test.ts       # nouveau — teste le handler isolément
```

## Style de code

Réutiliser le style déjà établi dans le projet cette session (unions discriminées,
petites fonctions pures, pas de `any`, pas de cast évitable, gestion d'erreur
explicite via `GameGenerationError`). Exemple pour le futur appel réseau côté client :

```ts
export async function generateGameFromPrompt(
  prompt: string,
  onProgress?: GenerationProgressListener,
  stepDelayMs = 250,
): Promise<GeneratedGameResult> {
  // ... validations locales de longueur (inchangées, § 20 : limiter le prompt) ...

  onProgress?.("analyzing");
  const progressTimer = simulateProgress(onProgress, stepDelayMs);

  try {
    const response = await fetch("/api/games/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: trimmedPrompt,
      } satisfies GenerateGameRequest),
    });

    if (!response.ok) {
      throw new GameGenerationError(
        "MODEL_UNAVAILABLE",
        "Le serveur de génération est injoignable.",
      );
    }

    const payload = (await response.json()) as GenerateGameResponse;

    if (!payload.success || !payload.result) {
      throw new GameGenerationError(
        payload.error?.code ?? "VALIDATION_FAILED",
        payload.error?.message ?? "La génération a échoué.",
      );
    }

    onProgress?.("ready");
    return payload.result;
  } finally {
    clearProgressTimer(progressTimer);
  }
}
```

(Illustratif — la forme exacte sera affinée en phase Tasks, notamment la validation
du `payload` reçu avec `generatedGameResultSchema`/le schéma de réponse avant de faire
confiance à sa forme, cf. §22 « considérer comme non fiables … les sorties du modèle ».)

## Stratégie de tests

- **Unitaire (Vitest)** :
  - `generate-game-route.test.ts` (nouveau) : teste la fonction handler en l'appelant
    directement avec un `Mastra`/workflow mocké — pas de serveur HTTP réel démarré.
    Couvre : prompt valide → `{success:true, result}` ; prompt vide/trop long →
    `{success:false, error:{code:"INVALID_PROMPT"}}` ; échec de validation du
    workflow → `{success:false, error:{code:"VALIDATION_FAILED"}}` ; erreur
    inattendue → pas de stack trace exposée (§22, §28).
  - `chat-service.test.ts` (modifié) : mock `global.fetch`, vérifie le mapping
    réponse → `GeneratedGameResult` / erreurs, et que les callbacks `onProgress`
    sont bien appelés dans l'ordre attendu.
- **End-to-end (Playwright)** : `game-generation-chat.spec.ts` (§25) — mock la
  requête réseau (`page.route("**/api/games/generate", ...)`) pour ne jamais
  dépendre d'un vrai appel LLM payant, conformément à CLAUDE.md §25.
- Pas de nouveau niveau de test requis au-delà de l'existant.

## Limites

- **Toujours** : garder `chat-service.ts` exempt de logique de sélection de
  template/génération (déplacée côté serveur) ; ne jamais afficher une stack
  trace ou un message d'erreur brut du serveur au-delà de ce que
  `GameGenerationError` porte ; valider le corps de réponse HTTP avant de lui
  faire confiance (schéma Zod, cf. §22) ; garder `chat-panel.ts` inchangé si
  possible.
- **Demander avant** : changer `start.sh` de façon disruptive (ex. si la
  convention `src/mastra/public` impose de déplacer physiquement `public/` —
  à valider avant d'exécuter) ; toute dépendance frontend supplémentaire même
  légère ; toute modification du format de `generated-games.json`.
- **Jamais** : appeler un fournisseur de modèle directement depuis le
  navigateur ; exposer une clé API côté client ; réintroduire une génération
  mockée en silence si l'appel réseau échoue (échouer proprement à la place,
  §9 « Gestion des erreurs »).

## Critères de succès

1. `pnpm build && pnpm dev` (ou l'équivalent post-Plan) sert la page ET l'API
   depuis la même origine.
2. Un prompt valide déclenche un vrai appel au `gameDesignerAgent`/
   `generateGameWorkflow`, retourne un `GeneratedGameResult` réel, et le jeu est
   jouable immédiatement via « Tester le jeu ».
3. Les états de progression (`analyzing/generating/validating/saving/ready`)
   s'affichent toujours, même si de façon simulée.
4. Un prompt vide/trop long, une réponse de modèle invalide, ou une panne
   réseau produisent chacun un message d'erreur compréhensible dans le chat,
   sans jeu invalide ajouté au catalogue (§9).
5. `pnpm typecheck`, `pnpm test`, `pnpm build` passent tous.
6. Aucune clé API, aucun détail technique brut n'apparaît côté navigateur
   (console incluse).

## Questions ouvertes

1. **Mécanisme exact de service du frontend par Mastra** : convention
   `src/mastra/public/` (fichiers copiés au build) vs. route catch-all
   `registerApiRoute` qui lit `public/index.html`/`public/dist/*` directement à
   l'emplacement actuel. Impact concret sur combien de fichiers/chemins
   bougent. À trancher en phase Plan après vérification précise de la
   documentation Mastra installée.
2. Faut-il conserver `mastra dev` pour un usage « développement » local
   (Studio inclus sur `/`, ou déplacé) une fois qu'une route custom sert
   aussi `/` pour le frontend ? Risque de collision entre Studio et la page
   de l'app sur la racine `/`.
3. `.env` réel (déjà présent sur cette machine, non lu ici) contient-il déjà
   une clé de provider valide pour tester un appel de bout en bout, ou faut-il
   prévoir un test manuel guidé pour l'utilisateur avant de considérer
   l'étape terminée ?
