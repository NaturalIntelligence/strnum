/**
 * @typedef {Object} Options
 * @property {boolean} [hex=true] - Whether to allow hexadecimal numbers (e.g., "0x1A").
 * @property {boolean} [leadingZeros=true] - Whether to allow leading zeros in numbers.
 * @property {RegExp} [skipLike] - A regular expression to skip certain string patterns.
 * @property {string} [decimalPoint="."] - The character used as the decimal point.
 * @property {boolean} [eNotation=true] - Whether to allow scientific notation (e.g., "1e10").
 */

/**
 * The character used for scientific notation in numbers, based on the environment.
 * This is determined by checking if a large number can be represented in scientific notation.
 * @type {"e"|"E"}
 * @constant
 */
const EXP_CHAR = String(1e100).indexOf("e") !== -1 ? "e" : "E";

/**
 * @type {(string: string, radix: 10|16) => number}
 */
const parse_int = ((function parse_int() {
    if (parseInt) return parseInt;
    else if (Number.parseInt) return Number.parseInt;
    else if (window && window.parseInt) return window.parseInt;
    else return function parseInt() {
        throw new Error("parseInt, Number.parseInt, window.parseInt are not supported")
    };
})());

/**
 * @template {*} T
 * @param {T} str - The string to convert to a number.
 * @param {Options} [options] - Options to control the conversion behavior.
 * @returns {number|T} - The converted number or the original value if conversion is not applicable.
 */
export default function toNumber(str, options = {}) {
    if (!str || typeof str !== "string") return str;

    const analyzeResult = analyzeNumber(str, options);

    if (analyzeResult === INVALID) {
        return str;
    }

    if (options.skipLike !== undefined) {
        const trimmedStr = ((analyzeResult & WHITESPACE) === WHITESPACE)
            ? str.trim()
            : str;
        if (options.skipLike.test(trimmedStr)) {
            return str;
        }
    }

    if ((analyzeResult & HEX) === HEX) {
        return parse_int(str, 16);
    }

    if ((analyzeResult & EXPONENT) === EXPONENT) {
        if (options.eNotation !== false) {
            return Number(str);
        }
        return str;
    }

    const num = Number(str);
    const parsedStr = String(num);

    if (parsedStr.indexOf(EXP_CHAR) !== -1) {
        if (options.eNotation !== false) return num;
        else return str;
    }

    // If the number is out of safe integer range, return the original string
    if (((analyzeResult & FLOAT) !== FLOAT) && (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER)) {
        return str;
    }

    if ((analyzeResult & FLOAT) === FLOAT) {
        const parsedDecimalPoint = parsedStr.indexOf(".") + 1;

        const strDecimalPoint = str.indexOf(options.decimalPoint || ".") + 1;

        let i = 0;
        const parsedFracLength = parsedStr.length - parsedDecimalPoint;
        for (; i < parsedFracLength; i++) {
            if (parsedStr[parsedDecimalPoint + i] !== str[strDecimalPoint + i]) {
                return str;
            }
        }

        // ignore trailing zeros and whitespace in the fractional part
        i += strDecimalPoint;
        for (; i < str.length; i++) {
            switch (str[i]) {
                case "0":
                case " ":
                    continue;
                default:
                    return str;
            }
        }
    }

    return num;
}

const VALID = /** @type {const} */ (0);
const INVALID = /** @type {const} */ (1);

// Data types
const INTEGER = /** @type {const} */ (2);
const FLOAT = /** @type {const} */ (4);
const HEX = /** @type {const} */ (8);
const EXPONENT = /** @type {const} */ (16); // 'e' or 'E'

// Special character codes
const SIGN = /** @type {const} */ (32);
const ZERO = /** @type {const} */ (64);
const WHITESPACE = /** @type {const} */ (128);

// Positional constants
const BEGIN = /** @type {const} */ (256);
const END = /** @type {const} */ (512);

const OWS = /** @type {const} */ (384); // WHITESPACE | BEGIN Optional whitespace
const TRAILING_WHITESPACE = /** @type {const} */ (640); // WHITESPACE | END

const BEGIN_INTEGER_DIGITS = /** @type {const} */ (258); // INTEGER | BEGIN
const BEGIN_FLOAT_DIGITS = /** @type {const} */ (260); // FLOAT | BEGIN
const BEGIN_HEX = /** @type {const} */ (264); // HEX | BEGIN
const BEGIN_EXPONENT = /** @type {const} */ (272); // EXPONENT_DIGITS | BEGIN
const BEGIN_ZEROS = /** @type {const} */ (320); // BEGIN | ZEROS

const ZERO_DIGITS = /** @type {const} */ (64); // ZEROS

const INVALID_ZEROS = /** @type {const} */ (65); // ZEROS | INVALID

/** @typedef {typeof INVALID|typeof BEGIN|typeof OWS|typeof ZERO_DIGITS|typeof BEGIN_ZEROS|typeof INVALID_ZEROS|typeof INTEGER|typeof BEGIN_FLOAT_DIGITS|typeof FLOAT|typeof BEGIN_EXPONENT|typeof EXPONENT|typeof TRAILING_WHITESPACE|typeof HEX|typeof BEGIN_HEX} State */

/**
 * @param {string} str - The string to analyze.
 * @param {Options} options - Options to control the parsing behavior.
 * @returns {number} - A bitmask representing the analysis result of the string.
 */
function analyzeNumber(str, options) {
    let len = str.length;

    /** @type {State} */
    let state = BEGIN;
    let length = 0;
    let pos = -1;

    let result = VALID;

    const DECIMAL = options.decimalPoint || "\.";
    const ON_HEX = options.hex !== false ? BEGIN_HEX : INVALID;
    const ON_E = options.eNotation !== false ? BEGIN_EXPONENT : INVALID;
    const ON_LEADING_ZEROS = options.leadingZeros === false ? INVALID_ZEROS : BEGIN_ZEROS;

    while (++pos < len) {
        switch (str[pos]) {
            case " ":
                switch (state) {
                    case BEGIN:
                        result |= WHITESPACE;
                        state = OWS;
                    case OWS:
                    case TRAILING_WHITESPACE:
                        continue;
                    case HEX:
                    case EXPONENT:
                    case INTEGER:
                    case FLOAT:
                        result |= WHITESPACE;
                        state = TRAILING_WHITESPACE;
                        continue;
                    default:
                        return INVALID;
                }
            case "+":
            case "-":
                switch (state) {
                    case BEGIN:
                    case OWS:
                        result |= SIGN;
                        state = ZERO_DIGITS;
                        continue;
                    case BEGIN_EXPONENT:
                        state = EXPONENT;
                        continue;
                    default:
                        return INVALID;
                }
            case "0":
                switch (state) {
                    case FLOAT:
                        ++length;
                    case EXPONENT:
                    case HEX:
                    case INTEGER:
                        continue;
                    case INVALID_ZEROS:
                        return INVALID;
                    case OWS:
                    case BEGIN:
                    case ZERO_DIGITS:
                        state = ON_LEADING_ZEROS;
                    case BEGIN_ZEROS:
                        ++length;
                        continue;
                    case BEGIN_EXPONENT:
                        result |= EXPONENT;
                        state = EXPONENT;
                        continue;
                    case BEGIN_FLOAT_DIGITS:
                        state = FLOAT;
                        continue;
                    case BEGIN_HEX:
                        result |= HEX;
                        state = HEX;
                        continue;
                    default:
                        return INVALID;
                }
            case "x":
                switch (state) {
                    case BEGIN_ZEROS:
                        if (length !== 1) {
                            return INVALID;
                        }
                    case INVALID_ZEROS:
                        state = ON_HEX;
                        continue;
                    default:
                        return INVALID;
                }
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                switch (state) {
                    case FLOAT:
                        length = 0;
                    case EXPONENT:
                    case HEX:
                    case INTEGER:
                        continue;
                    case ZERO_DIGITS:
                    case BEGIN_ZEROS:
                    case BEGIN:
                    case OWS:
                        state = INTEGER;
                        continue;
                    case BEGIN_HEX:
                        result |= HEX;
                        state = HEX;
                        continue;
                    case BEGIN_EXPONENT:
                        result |= EXPONENT;
                        state = EXPONENT;
                        continue;
                    case BEGIN_FLOAT_DIGITS:
                        result |= FLOAT;
                        state = FLOAT;
                        continue;
                    default:
                        return INVALID;
                }
            case "a":
            case "b":
            case "c":
            case "d":
            case "f":
            case "A":
            case "B":
            case "C":
            case "D":
            case "F":
                switch (state) {
                    case BEGIN_HEX:
                        result |= HEX;
                        state = HEX;
                    case HEX:
                        continue;
                    default:
                        return INVALID;
                }
            case DECIMAL:
                switch (state) {
                    case BEGIN:
                    case ZERO_DIGITS:
                    case INVALID_ZEROS:
                    case BEGIN_ZEROS:
                    case OWS:
                    case INTEGER:
                        state = BEGIN_FLOAT_DIGITS;
                        continue;
                    default:
                        return INVALID;
                }
            case "e":
            case "E":
                switch (state) {
                    case HEX:
                        continue;
                    case BEGIN_ZEROS:
                        if (length > 1) {
                            return INVALID;
                        }
                    case INTEGER:
                    case BEGIN_FLOAT_DIGITS:
                    case FLOAT:
                        result |= EXPONENT;
                        state = ON_E;
                        continue;
                    default:
                        return INVALID;
                }
            default:
                return INVALID;
        }
    }

    switch (state) {
        case INVALID_ZEROS:
        case BEGIN_ZEROS:
        case INTEGER:
        case BEGIN_FLOAT_DIGITS:
        case FLOAT:
        case TRAILING_WHITESPACE:
        case EXPONENT:
        case HEX:
            return result;
        default:
            return INVALID;
    }
}

console.log(toNumber('1.0e2 '))