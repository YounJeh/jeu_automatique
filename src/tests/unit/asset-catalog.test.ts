import { describe, expect, it } from "vitest";
import {
  ASSET_CATALOG,
  ASSET_IDS,
  getAssetById,
} from "../../game/assets/asset-catalog.js";

describe("ASSET_CATALOG", () => {
  it("has at least 3 entries", () => {
    expect(ASSET_CATALOG.length).toBeGreaterThanOrEqual(3);
  });

  it("has unique ids", () => {
    const ids = ASSET_CATALOG.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has positive width and height for every entry", () => {
    for (const item of ASSET_CATALOG) {
      expect(item.width).toBeGreaterThan(0);
      expect(item.height).toBeGreaterThan(0);
    }
  });

  it("points every src at public/assets/sprites/", () => {
    for (const item of ASSET_CATALOG) {
      expect(item.src).toMatch(/^\/assets\/sprites\/.+\.svg$/);
    }
  });

  it("derives ASSET_IDS from the catalog's own ids", () => {
    expect(ASSET_IDS).toEqual(ASSET_CATALOG.map((item) => item.id));
  });
});

describe("getAssetById", () => {
  it("finds an existing entry", () => {
    expect(getAssetById("crystal-purple")?.id).toBe("crystal-purple");
  });

  it("returns undefined for an unknown id", () => {
    expect(getAssetById("does-not-exist")).toBeUndefined();
  });
});
