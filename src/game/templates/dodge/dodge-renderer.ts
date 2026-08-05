import type { DodgeGameConfig } from "../../../mastra/schemas/dodge-game-config-schema.js";
import type { DodgeEngineState } from "./dodge-engine.js";
import {
  DODGE_CANVAS_HEIGHT,
  DODGE_CANVAS_WIDTH,
  DODGE_OBSTACLE_SIZE,
  DODGE_PLAYER_SIZE,
} from "./dodge-config.js";

export class DodgeRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: DodgeGameConfig;

  constructor(canvas: HTMLCanvasElement, config: DodgeGameConfig) {
    canvas.width = DODGE_CANVAS_WIDTH;
    canvas.height = DODGE_CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Le canvas 2D n'est pas disponible dans ce navigateur.");
    }

    this.ctx = ctx;
    this.config = config;
  }

  draw(state: DodgeEngineState): void {
    this.drawBackground();
    this.drawObstacles(state);
    this.drawPlayer(state);
    this.drawScore(state);

    if (state.status !== "playing") {
      this.drawOverlay(state);
    }
  }

  private drawBackground(): void {
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, DODGE_CANVAS_WIDTH, DODGE_CANVAS_HEIGHT);
  }

  private drawPlayer(state: DodgeEngineState): void {
    this.ctx.fillStyle = this.config.playerColor;
    this.ctx.fillRect(
      state.player.x,
      state.player.y,
      DODGE_PLAYER_SIZE,
      DODGE_PLAYER_SIZE,
    );
  }

  private drawObstacles(state: DodgeEngineState): void {
    this.ctx.fillStyle = this.config.obstacleColor;
    for (const obstacle of state.obstacles) {
      this.ctx.fillRect(
        obstacle.x,
        obstacle.y,
        DODGE_OBSTACLE_SIZE,
        DODGE_OBSTACLE_SIZE,
      );
    }
  }

  private drawScore(state: DodgeEngineState): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px sans-serif";
    this.ctx.fillText(`Score : ${state.score}`, 12, 24);
  }

  private drawOverlay(state: DodgeEngineState): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    this.ctx.fillRect(0, 0, DODGE_CANVAS_WIDTH, DODGE_CANVAS_HEIGHT);

    const message =
      state.status === "won"
        ? this.config.victoryMessage
        : this.config.defeatMessage;

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "24px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(message, DODGE_CANVAS_WIDTH / 2, DODGE_CANVAS_HEIGHT / 2);
    this.ctx.textAlign = "left";
  }
}
