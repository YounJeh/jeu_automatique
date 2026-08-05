import type { CollectGameConfig } from "../../../mastra/schemas/collect-game-config-schema.js";
import type { CollectEngineState } from "./collect-engine.js";
import {
  COLLECT_CANVAS_HEIGHT,
  COLLECT_CANVAS_WIDTH,
  COLLECT_COLLECTIBLE_SIZE,
  COLLECT_PLAYER_SIZE,
} from "./collect-config.js";

export class CollectRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: CollectGameConfig;

  constructor(canvas: HTMLCanvasElement, config: CollectGameConfig) {
    canvas.width = COLLECT_CANVAS_WIDTH;
    canvas.height = COLLECT_CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Le canvas 2D n'est pas disponible dans ce navigateur.");
    }

    this.ctx = ctx;
    this.config = config;
  }

  draw(state: CollectEngineState): void {
    this.drawBackground();
    this.drawCollectibles(state);
    this.drawPlayer(state);
    this.drawScore(state);

    if (state.status !== "playing") {
      this.drawOverlay(state);
    }
  }

  private drawBackground(): void {
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, COLLECT_CANVAS_WIDTH, COLLECT_CANVAS_HEIGHT);
  }

  private drawPlayer(state: CollectEngineState): void {
    this.ctx.fillStyle = this.config.playerColor;
    this.ctx.fillRect(
      state.player.x,
      state.player.y,
      COLLECT_PLAYER_SIZE,
      COLLECT_PLAYER_SIZE,
    );
  }

  private drawCollectibles(state: CollectEngineState): void {
    this.ctx.fillStyle = this.config.collectibleColor;
    const radius = COLLECT_COLLECTIBLE_SIZE / 2;
    for (const collectible of state.collectibles) {
      this.ctx.beginPath();
      this.ctx.arc(
        collectible.x + radius,
        collectible.y + radius,
        radius,
        0,
        Math.PI * 2,
      );
      this.ctx.fill();
    }
  }

  private drawScore(state: CollectEngineState): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px sans-serif";
    this.ctx.fillText(
      `Score : ${state.score} — ${state.collectedCount}/${this.config.targetCollectibleCount}`,
      12,
      24,
    );
  }

  private drawOverlay(state: CollectEngineState): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    this.ctx.fillRect(0, 0, COLLECT_CANVAS_WIDTH, COLLECT_CANVAS_HEIGHT);

    const message =
      state.status === "won"
        ? this.config.victoryMessage
        : this.config.defeatMessage;

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "24px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      message,
      COLLECT_CANVAS_WIDTH / 2,
      COLLECT_CANVAS_HEIGHT / 2,
    );
    this.ctx.textAlign = "left";
  }
}
