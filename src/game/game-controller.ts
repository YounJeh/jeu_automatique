import type { GameStatus } from "./core/game-state.js";
import { InputController } from "./core/input.js";
import type { GameCatalogItem } from "./types/game-catalog-item.js";
import type { DodgeEngine } from "./templates/dodge/dodge-engine.js";
import {
  DodgeRenderer,
  type DodgeSprites,
} from "./templates/dodge/dodge-renderer.js";
import type { CollectEngine } from "./templates/collect/collect-engine.js";
import { CollectRenderer } from "./templates/collect/collect-renderer.js";
import { getGameTemplateDefinition } from "./templates/game-template-catalog.js";

type ActiveGame =
  | { template: "dodge"; engine: DodgeEngine; renderer: DodgeRenderer }
  | { template: "collect"; engine: CollectEngine; renderer: CollectRenderer };

export type GameControllerUpdate = {
  status: GameStatus;
  score: number;
};

export type GameControllerListener = (update: GameControllerUpdate) => void;

export class GameController {
  private readonly canvas: HTMLCanvasElement;
  private readonly input = new InputController();
  private active: ActiveGame | null = null;
  private lastFrameTime: number | null = null;
  private frameHandle: number | null = null;
  private onUpdate: GameControllerListener | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  setUpdateListener(listener: GameControllerListener | null): void {
    this.onUpdate = listener;
  }

  loadGame(item: GameCatalogItem): void {
    this.stop();

    switch (item.config.template) {
      case "dodge": {
        const sprites: DodgeSprites | undefined =
          item.source === "generated"
            ? { player: "🐩", obstacle: "🐺" }
            : undefined;
        const engine = getGameTemplateDefinition(
          item.config.template,
        ).createEngine(item.config);
        const renderer = new DodgeRenderer(this.canvas, item.config, sprites);
        this.active = { template: "dodge", engine, renderer };
        break;
      }
      case "collect": {
        const engine = getGameTemplateDefinition(
          item.config.template,
        ).createEngine(item.config);
        const renderer = new CollectRenderer(this.canvas, item.config);
        this.active = { template: "collect", engine, renderer };
        break;
      }
    }

    this.start();
  }

  start(): void {
    if (!this.active) return;
    this.input.attach(window);
    this.lastFrameTime = null;
    this.frameHandle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.input.detach(window);
    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.active = null;
    this.lastFrameTime = null;
  }

  restart(): void {
    this.active?.engine.reset();
  }

  private readonly tick = (time: number): void => {
    const active = this.active;
    if (!active) return;

    const deltaMs = this.lastFrameTime === null ? 0 : time - this.lastFrameTime;
    this.lastFrameTime = time;

    switch (active.template) {
      case "dodge": {
        const state = active.engine.update(deltaMs, this.input.getState());
        active.renderer.draw(state);
        this.onUpdate?.({ status: state.status, score: state.score });
        break;
      }
      case "collect": {
        const state = active.engine.update(deltaMs, this.input.getState());
        active.renderer.draw(state);
        this.onUpdate?.({ status: state.status, score: state.score });
        break;
      }
    }

    this.frameHandle = requestAnimationFrame(this.tick);
  };
}
