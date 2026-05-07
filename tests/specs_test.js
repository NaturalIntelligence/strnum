// strnum_spec_test.js
import toNumber from "../strnum.js";
import { compare, filterCases } from "@byspec/numbers";
import { scenarios as ieeeScenarios } from "@byspec/numbers/ieee754";
import { scenarios as ecmaScenarios } from "@byspec/numbers/ecmascript";

const allScenarios = [...ieeeScenarios, ...ecmaScenarios];

// Configure strnum to match spec behavior where possible
const specCompatibleOptions = {
  hex: true,
  octal: true,
  binary: true,
  leadingZeros: true,
  eNotation: true,
  infinity: "infinity"  // Match Number() behavior: "1e1000" → Infinity
};

describe("strnum vs @byspec/numbers - IEEE 754", () => {

  it("overflow cases match spec", () => {
    const overflowCases = filterCases(ieeeScenarios, { scenario: "overflow" });

    for (const { input, meta } of overflowCases) {
      const result = toNumber(input, specCompatibleOptions);
      expect(compare(result, meta.value)).toBe(true);
    }
  });

  it("precision cases match spec", () => {
    const precisionCases = filterCases(ieeeScenarios, { scenario: "precision" });

    for (const { input, meta } of precisionCases) {

      const result = toNumber(input, specCompatibleOptions);
      if (input === "9007199254740993" || input === "9999999999999999") {
        expect(result).toEqual(input);
      } else {
        // console.log(result, meta)
        expect(compare(result, meta.value)).toBe(true);
      }
    }

  });

  it("negative zero cases match spec", () => {
    const negZeroCases = filterCases(ieeeScenarios, { tags: ["negative-zero"] });

    for (const { input, meta } of negZeroCases) {
      const result = toNumber(input, specCompatibleOptions);
      expect(compare(result, meta.value)).toBe(true);
    }
  });

  it("NaN cases match spec", () => {
    const nanCases = filterCases(ieeeScenarios, { tags: ["nan"] });

    for (const { input, meta } of nanCases) {
      const result = toNumber(input, specCompatibleOptions);
      expect(compare(result, meta.value)).toBe(true);
    }
  });
});

describe("strnum vs @byspec/numbers - ECMAScript", () => {

  it("coercion cases match spec", () => {
    const coercionCases = filterCases(ecmaScenarios, { scenario: "coercion" });

    for (const { input, meta } of coercionCases) {
      const result = toNumber(input, specCompatibleOptions);
      if (input.trim() === "") {
        expect(result).toEqual(input);
      } else {
        // console.log(result, meta)
        expect(compare(result, meta.value)).toBe(true);
      }
    }
  });

  it("parsing cases match spec", () => {
    const parsingCases = filterCases(ecmaScenarios, { scenario: "parsing" });

    for (const { input, meta } of parsingCases) {
      const result = toNumber(input, specCompatibleOptions);
      if (input.trim() === "-0x10") {
        expect(result).toEqual(-16);
      } else {
        expect(compare(result, meta.value)).toBe(true);
      }
    }
  });

  it("safe integer cases match spec", () => {
    const safeIntegerCases = filterCases(ecmaScenarios, { scenario: "safe-integer" });

    for (const { input, meta } of safeIntegerCases) {
      const result = toNumber(input, specCompatibleOptions);
      if (input === "9007199254740993" || input === "-9007199254740993") {
        expect(result).toEqual(input);
      } else {
        // console.log(result, meta)
        expect(compare(result, meta.value)).toBe(true);
      }
    }
  });
});

describe("strnum options that intentionally diverge from spec", () => {

  it("hex:false returns original string", () => {
    const hexCases = filterCases(allScenarios, { tags: ["hex"] });

    for (const { input } of hexCases) {
      expect(toNumber(input, { hex: false })).toBe(input);
    }
  });

  it("leadingZeros:false returns original string", () => {
    const leadingZeroCases = filterCases(allScenarios, { tags: ["leading-zero"] });

    for (const { input } of leadingZeroCases) {
      expect(toNumber(input, { leadingZeros: false })).toBe(input);
    }
  });

  it("infinity:original returns original string for overflow", () => {
    const overflowCases = filterCases(ieeeScenarios, { scenario: "overflow" });

    for (const { input } of overflowCases) {
      if (Math.abs(Number(input)) === Infinity) {
        expect(toNumber(input, { infinity: "original" })).toBe(input);
      }
    }
  });
});