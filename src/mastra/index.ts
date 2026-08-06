import { Mastra } from "@mastra/core";
import { gameDesignerAgent } from "./agents/game-designer-agent.js";
import { generateGameWorkflow } from "./workflows/generate-game-workflow.js";

export const mastra = new Mastra({
  agents: { gameDesignerAgent },
  workflows: { generateGameWorkflow },
});
