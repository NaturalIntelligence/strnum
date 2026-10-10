import toNumber from "../strnum.js";

describe("Should convert all the valid numeric strings to number", () => {
    it("should return undefined, null, empty string, or non-numeric as it is", () => {
        expect(toNumber(undefined)).not.toBeDefined();
        expect(toNumber(null)).toEqual(null);
        expect(toNumber("")).toEqual("");
        expect(toNumber(" ")).toEqual(" ");
        expect(toNumber("string")).toEqual("string");
        expect(toNumber("e89794659669cb7bb967db73a7ea6889c3891727")).toEqual("e89794659669cb7bb967db73a7ea6889c3891727");
    });
    it("should not parse number with spaces or comma", () => {
        expect(toNumber("12,12")).toEqual("12,12");
        expect(toNumber("12 12")).toEqual("12 12");
        expect(toNumber("12-12")).toEqual("12-12");
        expect(toNumber("12.12.12")).toEqual("12.12.12");
    })
    it("should consider + sign", () => {
        expect(toNumber("+12")).toEqual(12);
        expect(toNumber("+ 12")).toEqual("+ 12");
        expect(toNumber("12+12")).toEqual("12+12");
        expect(toNumber("1212+")).toEqual("1212+");
    })
    it("should parse hexadecimal values", () => {
        expect(toNumber("0x2f")).toEqual(47);
        expect(toNumber("-0x2f")).toEqual(-47);
        expect(toNumber("0x2f", { hex: true })).toEqual(47);
        expect(toNumber("-0x2f", { hex: true })).toEqual(-47);
        expect(toNumber("0x2f", { hex: false })).toEqual("0x2f");
        expect(toNumber("-0x2f", { hex: false })).toEqual("-0x2f");
    })
    it("should parse octal values", () => {
        expect(toNumber("0o10")).toEqual("0o10");
        expect(toNumber("-0o10")).toEqual("-0o10");
        expect(toNumber("0o10", { octal: true })).toEqual(8);
        expect(toNumber("-0o10", { octal: true })).toEqual("-0o10");
        expect(toNumber("0o10", { octal: false })).toEqual("0o10");
        expect(toNumber("-0o10", { octal: false })).toEqual("-0o10");
    })
    it("should parse binary values", () => {
        expect(toNumber("0b1010")).toEqual("0b1010");
        expect(toNumber("-0b1010")).toEqual("-0b1010");
        expect(toNumber("0b1010", { binary: true })).toEqual(10);
        expect(toNumber("-0b1010", { binary: true })).toEqual("-0b1010");
        expect(toNumber("0b1010", { binary: false })).toEqual("0b1010");
        expect(toNumber("-0b1010", { binary: false })).toEqual("-0b1010");
    })
    it("should not parse strings with 0x embedded", () => {
        expect(toNumber("0xzz")).toEqual("0xzz");
        expect(toNumber("iweraf0x123qwerqwer")).toEqual("iweraf0x123qwerqwer");
        expect(toNumber("1230x55")).toEqual("1230x55");
        expect(toNumber("JVBERi0xLjMNCiXi48")).toEqual("JVBERi0xLjMNCiXi48");
    })
    it("leading zeros", () => {
        expect(toNumber("0")).toEqual(0);
        expect(toNumber("00")).toEqual(0);
        expect(toNumber("00.0")).toEqual(0);

        expect(toNumber("0", { leadingZeros: false })).toEqual(0);
        expect(toNumber("00", { leadingZeros: false })).toEqual("00");
        expect(toNumber("00.0", { leadingZeros: false })).toEqual("00.0");

        expect(toNumber("06")).toEqual(6);
        expect(toNumber("06", { leadingZeros: true })).toEqual(6);
        expect(toNumber("06", { leadingZeros: false })).toEqual("06");

        expect(toNumber("006")).toEqual(6);
        expect(toNumber("006", { leadingZeros: true })).toEqual(6);
        expect(toNumber("006", { leadingZeros: false })).toEqual("006");

        expect(toNumber("000000000000000000000000017717", { leadingZeros: false })).toEqual("000000000000000000000000017717");
        expect(toNumber("000000000000000000000000017717", { leadingZeros: true })).toEqual(17717);
        expect(toNumber("020211201030005811824")).toEqual("020211201030005811824");
        expect(toNumber("0420926189200190257681175017717")).toEqual(4.209261892001902e+29);
    })
    it("invalid floating number", () => {
        expect(toNumber("20.21.030")).toEqual("20.21.030");
        expect(toNumber("0.21.030")).toEqual("0.21.030");
        expect(toNumber("0.21.")).toEqual("0.21.");
    });
    it("floating point and leading zeros", () => {
        expect(toNumber("0.")).toEqual(0);
        expect(toNumber("+0.")).toEqual(0);
        expect(toNumber("-0.")).toEqual(-0);
        expect(toNumber("1.")).toEqual(1);
        expect(toNumber("00.00")).toEqual(0);
        expect(toNumber("0.06")).toEqual(0.06);
        expect(toNumber("00.6")).toEqual(0.6);
        expect(toNumber(".006")).toEqual(0.006);
        expect(toNumber("6.0")).toEqual(6);
        expect(toNumber("06.0")).toEqual(6);

        expect(toNumber("0.0", { leadingZeros: false })).toEqual(0);
        expect(toNumber("00.00", { leadingZeros: false })).toEqual("00.00");
        expect(toNumber("0.06", { leadingZeros: false })).toEqual(0.06);
        expect(toNumber("00.6", { leadingZeros: false })).toEqual("00.6");
        expect(toNumber(".006", { leadingZeros: false })).toEqual(0.006);
        expect(toNumber("6.0", { leadingZeros: false })).toEqual(6);
        expect(toNumber("06.0", { leadingZeros: false })).toEqual("06.0");
    })
    it("negative number  leading zeros", () => {
        expect(toNumber("+06")).toEqual(6);
        expect(toNumber("-06")).toEqual(-6);
        expect(toNumber("-06", { leadingZeros: true })).toEqual(-6);
        expect(toNumber("-06", { leadingZeros: false })).toEqual("-06");

        expect(toNumber("-0.0")).toEqual(-0);
        expect(toNumber("-00.00")).toEqual(-0);
        expect(toNumber("-0.06")).toEqual(-0.06);
        expect(toNumber("-00.6")).toEqual(-0.6);
        expect(toNumber("-.006")).toEqual(-0.006);
        expect(toNumber("-6.0")).toEqual(-6);
        expect(toNumber("-06.0")).toEqual(-6);
        expect(toNumber("+06.0")).toEqual(6);

        expect(toNumber("-0.0", { leadingZeros: false })).toEqual(-0);
        expect(toNumber("-00.00", { leadingZeros: false })).toEqual("-00.00");
        expect(toNumber("-0.06", { leadingZeros: false })).toEqual(-0.06);
        expect(toNumber("-00.6", { leadingZeros: false })).toEqual("-00.6");
        expect(toNumber("-.006", { leadingZeros: false })).toEqual(-0.006);
        expect(toNumber("-6.0", { leadingZeros: false })).toEqual(-6);
        expect(toNumber("-06.0", { leadingZeros: false })).toEqual("-06.0");
    })
    it("long number", () => {
        expect(toNumber("020211201030005811824")).toEqual("020211201030005811824");
        expect(toNumber("20211201030005811824")).toEqual("20211201030005811824");
        expect(toNumber("20.211201030005811824")).toEqual("20.211201030005811824");
        expect(toNumber("0.211201030005811824")).toEqual("0.211201030005811824");
    });
    it("scientific notation", () => {
        expect(toNumber("01.0e2", { leadingZeros: false })).toEqual("01.0e2");
        expect(toNumber("-01.0e2", { leadingZeros: false })).toEqual("-01.0e2");
        expect(toNumber("01.0e2")).toEqual(100);
        expect(toNumber("-01.0e2")).toEqual(-100);
        expect(toNumber("1.0e2")).toEqual(100);

        expect(toNumber("-1.0e2")).toEqual(-100);
        expect(toNumber("1.0e-2")).toEqual(0.01);

        expect(toNumber("420926189200190257681175017717")).toEqual(4.209261892001902e+29);
        expect(toNumber("420926189200190257681175017717", { eNotation: false })).toEqual("420926189200190257681175017717");

        expect(toNumber("1e-2")).toEqual(0.01);
        expect(toNumber("1e+2")).toEqual(100);
        expect(toNumber("1.e+2")).toEqual(100);

        expect(toNumber("1.5e3", { leadingZeros: false })).toEqual(1500);
    });

    it("scientific notation with upper E", () => {
        expect(toNumber("01.0E2", { leadingZeros: false })).toEqual("01.0E2");
        expect(toNumber("-01.0E2", { leadingZeros: false })).toEqual("-01.0E2");
        expect(toNumber("01.0E2")).toEqual(100);
        expect(toNumber("-01.0E2")).toEqual(-100);
        expect(toNumber("1.0E2")).toEqual(100);

        expect(toNumber("-1.0E2")).toEqual(-100);
        expect(toNumber("1.0E-2")).toEqual(0.01);

        expect(toNumber("E-2")).toEqual("E-2");
        expect(toNumber("E2")).toEqual("E2");
        expect(toNumber("0E2")).toEqual(0);
        expect(toNumber("-0E2")).toEqual(-0);
        expect(toNumber("00E2")).toEqual("00E2");
        expect(toNumber("00E2", { leadingZeros: false })).toEqual("00E2");
    });

    it("scientific notation: leading zeros directly before the decimal point", () => {
        expect(toNumber("00.e0", { leadingZeros: true })).toEqual(0);
        expect(toNumber("-00.e5", { leadingZeros: true })).toEqual(-0);
        expect(toNumber("00.e0", { leadingZeros: false })).toEqual("00.e0");
        expect(toNumber("0.e0", { leadingZeros: true })).toEqual(0);
        expect(toNumber("001.0e2", { leadingZeros: true })).toEqual(100);
    });
    it("surrounding whitespace does not change the leading zeros handling", () => {
        expect(toNumber(" 0.1", { leadingZeros: false })).toEqual(0.1);
        expect(toNumber(" -0.1", { leadingZeros: false })).toEqual(-0.1);
        expect(toNumber(" 00.1", { leadingZeros: false })).toEqual(" 00.1");
        expect(toNumber(" 0.e0", { leadingZeros: false })).toEqual(0);
        expect(toNumber(" 00.e0")).toEqual(0);
        expect(toNumber(" 00E2")).toEqual(" 00E2");   // used to be NaN
    });

    it("should skip matching pattern", () => {
        expect(toNumber("0", { skipLike: /.*/ })).toEqual("0");
        expect(toNumber("+12", { skipLike: /\+[0-9]{10}/ })).toEqual(12);
        expect(toNumber("12+12", { skipLike: /\+[0-9]{10}/ })).toEqual("12+12");
        expect(toNumber("12+1212121212", { skipLike: /\+[0-9]{10}/ })).toEqual("12+1212121212");
        expect(toNumber("+1212121212")).toEqual(1212121212);
        expect(toNumber("+1212121212", { skipLike: /\+[0-9]{10}/ })).toEqual("+1212121212");
    })
    it("should not change string if not number", () => {
        expect(toNumber("+12 12")).toEqual("+12 12");
        expect(toNumber("    +12 12   ")).toEqual("    +12 12   ");
    })
    it("should ignore sorrounded spaces ", () => {
        expect(toNumber("   +1212   ")).toEqual(1212);
    })

    it("negative numbers", () => {
        expect(toNumber("+1212")).toEqual(1212);
        expect(toNumber("+12.12")).toEqual(12.12);
        expect(toNumber("-12.12")).toEqual(-12.12);
        expect(toNumber("-012.12")).toEqual(-12.12);
        expect(toNumber("-012.12")).toEqual(-12.12);
    })
});


describe("non-numeric strings are always returned unchanged", () => {
    const nonNumbers = ["E1", "e1", "+E1", ".e1", "A1", "abc", "Sheet2!A1", "12px", "1,5", "1.2.3", "--1", "1e", "NaN", " E1 "];

    for (const infinity of ["original", "null", "infinity", "string"]) {
        it(`infinity:"${infinity}"`, () => {
            for (const s of nonNumbers) {
                expect(toNumber(s, { infinity })).toBe(s);
            }
        });
    }
});

describe("infinity option applies only to real infinities", () => {
    const inf = ["Infinity", "-Infinity", "1e1000", "-1e1000"];
    it("original", () => inf.forEach(s => expect(toNumber(s, { infinity: "original" })).toBe(s)));
    it("null", () => inf.forEach(s => expect(toNumber(s, { infinity: "null" })).toBeNull()));
    it("infinity", () => expect(inf.map(s => toNumber(s, { infinity: "infinity" }))).toEqual([Infinity, -Infinity, Infinity, -Infinity]));
    it("string", () => expect(inf.map(s => toNumber(s, { infinity: "string" }))).toEqual(["Infinity", "-Infinity", "Infinity", "-Infinity"]));
});

describe("e-notation with leading zeros", () => {
    it("never returns NaN and matches Number()", () => {
        for (const s of ["00.e0", "00.e1", "00.E0", "00.E1", "0.e0", "01.0e2", "001.0e2", "-00.e1", "+00.E1"]) {
            const r = toNumber(s, { leadingZeros: true });
            expect(Number.isNaN(r)).toBe(false);
            expect(r).toBe(Number(s));
        }
    });
    it("returns the original string when leadingZeros is false", () => {
        for (const s of ["00.e0", "00e0"]) expect(toNumber(s, { leadingZeros: false })).toBe(s);
    });
    it("keeps 00e0 as a string (zeros adjacent to e)", () => {
        expect(toNumber("00e0", { leadingZeros: true })).toBe("00e0");
    });
});

describe("surrounding whitespace does not change the result", () => {
    const samples = ["0.1", "0.", "0.10", "+0.1", "00.e0", "00e0", "1.5e3", "007", "abc", "E1", "0x1F", "1e1000"];
    for (const leadingZeros of [true, false]) {
        it(`leadingZeros:${leadingZeros}`, () => {
            for (const s of samples) {
                const bare = toNumber(s, { leadingZeros });
                const padded = toNumber(`  ${s} `, { leadingZeros });
                expect(typeof bare === "number" ? padded : padded === `  ${s} `).toEqual(typeof bare === "number" ? bare : true);
            }
        });
    }
    it('" 0.1" with leadingZeros:false parses', () => {
        expect(toNumber(" 0.1", { leadingZeros: false })).toBe(0.1);
    });
});