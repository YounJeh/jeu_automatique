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
import type { ShooterEngine } from "./templates/shooter/shooter-engine.js";
import {
  ShooterRenderer,
  type ShooterSprites,
} from "./templates/shooter/shooter-renderer.js";
import { getGameTemplateDefinition } from "./templates/game-template-catalog.js";
import { isGenericRuntimeEnabled } from "./core/feature-flags.js";
import { GenericRuntime } from "./core/runtime/generic-runtime.js";
import { isGenericRuntimeCapable } from "./core/runtime/generic-runtime-capability.js";
import { GenericRenderer } from "./core/render/generic-renderer.js";
import type { GameTemplate } from "./types/game-template.js";

type ActiveGame =
  | { template: "dodge"; engine: DodgeEngine; renderer: DodgeRenderer }
  | { template: "collect"; engine: CollectEngine; renderer: CollectRenderer }
  | {
      template: "shooter";
      engine: ShooterEngine;
      renderer: ShooterRenderer;
    }
  | {
      template: GameTemplate;
      runtime: GenericRuntime;
      renderer: GenericRenderer;
    };

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

    if (
      isGenericRuntimeEnabled() &&
      item.definition &&
      isGenericRuntimeCapable(item.definition)
    ) {
      const runtime = new GenericRuntime();
      runtime.load(item.definition);
      runtime.start();
      const renderer = new GenericRenderer(this.canvas, item.definition);
      this.active = { template: item.template, runtime, renderer };
      this.start();
      return;
    }

    if (!item.config) {
      throw new Error(
        `"${item.id}" n'a pas de configuration jouable : ni le moteur générique ` +
          "(désactivé, ou définition incompatible) ni le moteur legacy " +
          "(aucun config) ne peuvent le charger.",
      );
    }

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
      case "shooter": {
        const sprites: ShooterSprites | undefined =
          item.source === "generated"
            ? { player: "🚀", enemy: "👾", projectile: "✨" }
            : undefined;
        const engine = getGameTemplateDefinition(
          item.config.template,
        ).createEngine(item.config);
        const renderer = new ShooterRenderer(this.canvas, item.config, sprites);
        this.active = { template: "shooter", engine, renderer };
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
    const active = this.active;
    if (!active) return;

    if ("runtime" in active) {
      active.runtime.restart();
    } else {
      active.engine.reset();
    }
  }

  private readonly tick = (time: number): void => {
    const active = this.active;
    if (!active) return;

    const deltaMs = this.lastFrameTime === null ? 0 : time - this.lastFrameTime;
    this.lastFrameTime = time;

    if ("runtime" in active) {
      const state = active.runtime.update(deltaMs, this.input.getState());
      active.renderer.draw(state);
      this.onUpdate?.({ status: state.status, score: state.score });
    } else {
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
        case "shooter": {
          const state = active.engine.update(deltaMs, this.input.getState());
          active.renderer.draw(state);
          this.onUpdate?.({ status: state.status, score: state.score });
          break;
        }
      }
    }

    this.frameHandle = requestAnimationFrame(this.tick);
  };
}
