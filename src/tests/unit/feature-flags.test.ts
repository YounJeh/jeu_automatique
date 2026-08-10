import { afterEach, describe, expect, it } from "vitest";
import { isGenericRuntimeEnabled } from "../../game/core/feature-flags.js";

const ORIGINAL_VALUE = process.env.GENERIC_RUNTIME_ENABLED;

afterEach(() => {
  if (ORIGINAL_VALUE === undefined) {
    delete process.env.GENERIC_RUNTIME_ENABLED;
  } else {
    process.env.GENERIC_RUNTIME_ENABLED = ORIGINAL_VALUE;
  }
});

describe("isGenericRuntimeEnabled", () => {
  it("is false when the env var is unset", () => {
    delete process.env.GENERIC_RUNTIME_ENABLED;
    expect(isGenericRuntimeEnabled()).toBe(false);
  });

  it("is false for any value other than the literal string 'true'", () => {
    process.env.GENERIC_RUNTIME_ENABLED = "1";
    expect(isGenericRuntimeEnabled()).toBe(false);
  });

  it("is true when set to 'true'", () => {
    process.env.GENERIC_RUNTIME_ENABLED = "true";
    expect(isGenericRuntimeEnabled()).toBe(true);
  });
});
