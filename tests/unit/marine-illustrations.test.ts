import { describe, expect, it } from "vitest";
import {
  dimensionsFor,
  inches,
  scaleFor,
  templates,
} from "../../src/lib/marine/illustrations";

describe("marine illustration measurements", () => {
  const boat = {
    template: "jet" as const,
    length: 200,
    beam: 72,
    label: "Fixture",
  };
  it("uses a single physical scale across measured profiles", () => {
    const scale = scaleFor(200);
    expect(dimensionsFor(boat, true, scale)).toEqual({
      width: 500,
      height: 180,
      measured: true,
    });
    expect(dimensionsFor({ ...boat, length: 100 }, false, scale).width).toBe(
      250,
    );
  });
  it("does not imply a measured top view without a beam", () => {
    expect(dimensionsFor({ ...boat, beam: null }, true, 2).measured).toBe(
      false,
    );
    expect(dimensionsFor({ ...boat, beam: null }, false, 2).measured).toBe(
      true,
    );
  });
  it("converts recognized units and rejects invalid dimensions", () => {
    expect(inches({ amount: 12, unit: "ft" })).toBe(144);
    expect(inches({ amount: 2.54, unit: "cm" })).toBeCloseTo(1);
    expect(inches({ amount: 1, unit: "unknown" })).toBeNull();
    expect(inches({ amount: -1, unit: "in" })).toBeNull();
    expect(new Set(templates).size).toBe(17);
  });
});
