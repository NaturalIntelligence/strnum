import toNumber from "../strnum.js";

describe("Should convert non-ascii numerals first", () => {
  it("should convert de", () => {
    expect(toNumber("1000", { unicode: true })).toEqual(1000);
    expect(toNumber("１000", { unicode: true })).toEqual(1000);
    expect(toNumber("1e1000", { unicode: true, infinity: "original" })).toEqual("1e1000");
    expect(toNumber("１e１000", { unicode: true, infinity: "original" })).toEqual("１e１000");
  });
});