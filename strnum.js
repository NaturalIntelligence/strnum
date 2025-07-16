/**
 * @typedef {Object} Options
 * @property {boolean} [hex=true] - Whether to allow hexadecimal numbers (e.g., "0x1A").
 * @property {boolean} [leadingZeros=true] - Whether to allow leading zeros in numbers.
 * @property {RegExp} [skipLike] - A regular expression to skip certain string patterns.
 * @property {string} [decimalPoint="."] - The character used as the decimal point.
 * @property {boolean} [eNotation=true] - Whether to allow scientific notation (e.g., "1e10").
 */

/** @type {Options} */
const defaultOptions = {
    hex: true,
    leadingZeros: true,
    decimalPoint: "\.",
    eNotation: true,
};

/**
 * The character used for scientific notation in numbers, based on the environment.
 * This is determined by checking if a large number can be represented in scientific notation.
 * @type {"e"|"E"}
 * @constant
 */
const EXP_CHAR = (function returnExpChar() {
    const bigNumber = 1e1000;
    const str = String(bigNumber);
    return str.indexOf("e") === -1 ? "e" : "E";
})();

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

const ERROR = 0;
const IS_EMPTY = 1 << 0;
const IS_HEX = 1 << 1;
const IS_FLOAT = 1 << 2;
const HAS_WHITESPACE = 1 << 3;
const HAS_E = 1 << 4;

/**
 * @template {*} T
 * @param {T} str - The string to convert to a number.
 * @param {Options} [options] - Options to control the conversion behavior.
 * @returns {number|T} - The converted number or the original value if conversion is not applicable.
 */
export default function toNumber(str, options = {}) {
    if (!str || typeof str !== "string") return str;

    const analyzeResult = analyzeNumber(str, options);

    if (options.skipLike !== undefined) {
        const trimmedStr = ((analyzeResult & HAS_WHITESPACE) === HAS_WHITESPACE)
            ? str.trim()
            : str;
        if (options.skipLike.test(trimmedStr)) {
            return str;
        }
    }

    if (analyzeResult === ERROR) {
        return str;
    }

    if ((analyzeResult & IS_HEX) === IS_HEX) {
        return parse_int(str, 16);
    }

    if ((analyzeResult & HAS_E) === HAS_E) {
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
    if (((analyzeResult & IS_FLOAT) !== IS_FLOAT) && (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER)) {
        return str;
    }

    if ((analyzeResult & IS_FLOAT) === IS_FLOAT) {
        const parsedDecimalPoint = parsedStr.indexOf(".") + 1;

        if ((parsedStr.length - parsedDecimalPoint) > 10) {
            const strDecimalPoint = str.indexOf(options.decimalPoint || ".") + 1;

            for (let i = 0; i < parsedStr.length; i++) {
                if (parsedStr[parsedDecimalPoint + i] !== str[strDecimalPoint + i]) {
                    return str;
                }
            }
        }
    }

    return num;
}

const INVALID = ERROR;
const BEGIN = 1;
const OWS = 2;
const SIGN = 3;
const LEADING_ZEROS = 4;
const INT = 5;
const BEGIN_FRAC = 6;
const FRAC = 7;
const EXP = 8;
const TRAILING_ZEROS = 9;
const TRAILING_SPACE = 10;
const HEX = 11;

/**
 * @param {string} str - The string to analyze.
 * @param {Options} options - Options to control the parsing behavior.
 * @returns {number} - A bitmask representing the analysis result of the string.
 */
function analyzeNumber(str, options) {
    let len = str.length;

    let state = BEGIN;
    let start = 0;
    let length = 0;
    let trailingZeros = 0;
    let pos = 0;

    let result = IS_EMPTY;

    const ON_HEX = options.hex !== false ? HEX : INVALID;
    const DECIMAL = options.decimalPoint || "\.";
    const ON_E = options.eNotation !== false ? EXP : INVALID;
    const NO_LEADING_ZEROS = options.leadingZeros === false;

    while (pos < len) {
        switch (str[pos]) {
            case " ":
                switch (state) {
                    case BEGIN:
                        ++pos;
                        result |= HAS_WHITESPACE;
                        state = OWS;
                        continue;
                    case OWS:
                    case TRAILING_SPACE:
                        ++pos;
                        continue;
                    case INT:
                    case FRAC:
                        ++pos;
                        result |= HAS_WHITESPACE;
                        state = TRAILING_SPACE;
                        continue;
                    default:
                        return ERROR;
                }
            case "+":
            case "-":
                switch (state) {
                    case BEGIN:
                    case OWS:
                    case SIGN:
                        state = LEADING_ZEROS;
                        start = ++pos;
                        break;
                    case EXP:
                        if (length === 0) {
                            start = ++pos;
                            ++length;
                            continue;
                        }
                    default:
                        return ERROR;
                }
                break;
            case "0":
                switch (state) {
                    case BEGIN:
                        state = LEADING_ZEROS;
                        start = ++pos;
                        length = 1;
                        break;
                    case LEADING_ZEROS:
                        if (NO_LEADING_ZEROS && length === 1) {
                            return ERROR;
                        }
                        ++length;
                        ++start;
                        ++pos;
                        continue;
                    case OWS:
                    case SIGN:
                        ++length;
                        ++start;
                        ++pos;
                        state = LEADING_ZEROS;
                        continue;
                    case BEGIN_FRAC:
                        result |= IS_FLOAT;
                        state = FRAC;
                    case FRAC:
                        trailingZeros++;
                    case INT:
                        ++pos;
                        continue;
                    default:
                        return ERROR;
                }
                break;
            case "x":
                switch (state) {
                    case LEADING_ZEROS:
                        if (length !== 1) {
                            return ERROR;
                        }
                        start = ++pos;
                        length = 0;
                        result |= IS_HEX;
                        state = ON_HEX;
                        continue;
                    default:
                        return ERROR;
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
                    case LEADING_ZEROS:
                        if (NO_LEADING_ZEROS && length === 1) {
                            return ERROR;
                        }
                    case BEGIN:
                    case OWS:
                    case SIGN:
                        state = INT;
                    case HEX:
                    case INT:
                    case EXP:
                        ++pos;
                        ++length;
                        break;
                    case BEGIN_FRAC:
                        result |= IS_FLOAT;
                        state = FRAC;
                    case FRAC:
                        trailingZeros = 0;
                        ++length;
                        ++pos;
                        break;
                    default:
                        return ERROR;
                }
                break;
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
                    case HEX:
                        ++pos;
                        ++length;
                        break;
                    default:
                        return ERROR;
                }
                break;
            case DECIMAL:
                switch (state) {
                    case BEGIN:
                    case LEADING_ZEROS:
                    case OWS:
                    case SIGN:
                    case INT:
                        start = ++pos;
                        length = 0;
                        state = BEGIN_FRAC;
                        break;
                    default:
                        return ERROR;
                }
                break;
            case "e":
            case "E":
                switch (state) {
                    case LEADING_ZEROS:
                        if (length > 1) {
                            return ERROR;
                        }
                    case INT:
                    case BEGIN_FRAC:
                    case FRAC:
                        length = 0;
                        start = ++pos;
                        result |= HAS_E;
                        state = ON_E;
                        break;
                    case HEX:
                        ++pos;
                        ++length;
                        break;
                    default:
                        return ERROR;
                }
                break;
            default:
                return ERROR;
        }
    }

    switch (state) {
        case LEADING_ZEROS:
        case INT:
        case BEGIN_FRAC:
        case FRAC:
        case TRAILING_ZEROS:
        case TRAILING_SPACE:
            return result;
        case EXP:
        case HEX:
            return length === 0 ? ERROR : result;
        default:
            return ERROR;
    }
}
