import { Mastra } from "@mastra/core";
import { registerApiRoute } from "@mastra/core/server";
import { gameDesignerAgent } from "./agents/game-designer-agent.js";
import { generateGameRoute } from "./server/generate-game-route.js";
import { serveFrontendFile } from "./server/static-frontend-route.js";
import { generateGameWorkflow } from "./workflows/generate-game-workflow.js";

export const mastra = new Mastra({
  agents: { gameDesignerAgent },
  workflows: { generateGameWorkflow },
  server: {
    // 0.0.0.0 (au lieu du localhost par défaut) pour rester joignable via le
    // forwarding de ports de GitHub Codespaces (voir start.sh).
    host: "0.0.0.0",
    // Studio est déplacé hors de la racine pour laisser "/" servir la page
    // de l'application (voir specs/etape-5-connexion-frontend-backend.md).
    studioBase: "/studio",
    apiRoutes: [
      // Sert public/index.html et public/dist/** directement (la convention
      // src/mastra/public ne s'applique qu'à "mastra build", pas à
      // "mastra dev" — vérifié en pratique). Chemins volontairement précis
      // (pas de "*" global) pour ne jamais intercepter /studio ou /api.
      registerApiRoute("/", { method: "GET", handler: serveFrontendFile }),
      registerApiRoute("/dist/*", {
        method: "GET",
        handler: serveFrontendFile,
      }),
      generateGameRoute,
    ],
  },
});
