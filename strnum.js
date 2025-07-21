/**
 * @typedef {Object} Options
 * @property {boolean} [hex=true] - Whether to allow hexadecimal numbers (e.g., "0x1A").
 * @property {boolean} [octal=false] - Whether to allow octal numbers (e.g., "0o17").
 * @property {boolean} [binary=false] - Whether to allow binary numbers (e.g., "0b1010").
 * @property {boolean} [bigint=false] - Whether to allow BigInt numbers (e.g., "123n").
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
const EXP_CHAR = function () {
    const bigNumberAsString = '' + 1e100;
    if (bigNumberAsString.indexOf("e") !== -1) {
        return "e";
    } else if (bigNumberAsString.indexOf("E") !== -1) {
        return "E";
    } else {
        throw new Error("Cannot determine scientific notation character");
    }
}();

/** @type {(string: string, radix: 2|8|10|16) => number} */
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

    if (analyzeResult === NOT_A_NUMBER) {
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
        return parse_int(str, HEX);
    }

    if ((analyzeResult & OCTAL) === OCTAL) {
        if ((analyzeResult & WHITESPACE) === WHITESPACE) {
            return parse_int(str.trim().slice(2), OCTAL);
        }
        return parse_int(str.slice(2), OCTAL);
    }

    if ((analyzeResult & BINARY) === BINARY) {
        if ((analyzeResult & WHITESPACE) === WHITESPACE) {
            return parse_int(str.trim().slice(2), BINARY);
        }
        return parse_int(str.slice(2), BINARY);
    }

    if ((analyzeResult & EXPONENT_INDICATOR) === EXPONENT_INDICATOR) {
        if (options.eNotation !== false) {
            return +str;
        }
        return str;
    }

    const num = (analyzeResult & INTEGER) === INTEGER ? parse_int(str, 10) : +str;
    const parsedStr = '' + num;

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

const NUMBER = /** @type {const} */ assertBitmask(0, 0);
const NOT_A_NUMBER = /** @type {const} */ assertBitmask(1, 1 << 0);

const BINARY = /** @type {const} */ assertBitmask(2, 1 << 1);
const DECIMAL = /** @type {const} */ assertBitmask(4, 1 << 2);
const OCTAL = /** @type {const} */ assertBitmask(8, 1 << 3);
const HEX = /** @type {const} */ assertBitmask(16, 1 << 4);

const FLOAT = /** @type {const} */ assertBitmask(32, 1 << 5);
const INTEGER = /** @type {const} */ assertBitmask(64, 1 << 6);
const BIGINT = /** @type {const} */ assertBitmask(2112, INTEGER | 1 << 11);

// Special character codes
const WHITESPACE = /** @type {const} */ assertBitmask(128, 1 << 7);
const ZERO = /** @type {const} */  assertBitmask(256, 1 << 8);
const SIGN = /** @type {const} */  assertBitmask(512, 1 << 9);
const EXPONENT_INDICATOR = /** @type {const} */ assertBitmask(1024, 1 << 10); // 'e' or 'E'
const BIGINT_LITERAL_SUFFIX = /** @type {const} */ assertBitmask(2048, 1 << 11); // 'n' for BigInt


// Positional constants
const BEGIN = /** @type {const} */ assertBitmask(2048, 1 << 11);
const END = /** @type {const} */ assertBitmask(4096, 1 << 12);

const LEADING_WHITESPACE = /** @type {const} */ assertBitmask(2176, WHITESPACE | BEGIN);
const TRAILING_WHITESPACE = /** @type {const} */ assertBitmask(4224, WHITESPACE | END);

const BEGIN_INTEGER_DIGITS = /** @type {const} */ assertBitmask(2052, DECIMAL | BEGIN);
const BEGIN_FRAC_DIGITS = /** @type {const} */ assertBitmask(2080, FLOAT | BEGIN);
const BEGIN_HEX = /** @type {const} */ assertBitmask(2064, HEX | BEGIN);
const BEGIN_OCTAL = /** @type {const} */ assertBitmask(2056, OCTAL | BEGIN);
const BEGIN_BINARY = /** @type {const} */ assertBitmask(2050, BINARY | BEGIN);

const BEGIN_EXPONENT = /** @type {const} */ assertBitmask(3072, EXPONENT_INDICATOR | BEGIN);
const EXPONENT_SIGN = /** @type {const} */ assertBitmask(1536, EXPONENT_INDICATOR | SIGN);
const EXPONENT_INTEGER = /** @type {const} */ assertBitmask(1088, EXPONENT_INDICATOR | INTEGER);

const FIRST_DIGIT_ZERO = /** @type {const} */ assertBitmask(2304, ZERO | BEGIN);
const FIRST_DIGIT_ZERO_NOT_LEADING = /** @type {const} */ assertBitmask(6400, ZERO | BEGIN | END);
const LEADING_ZEROS = /** @type {const} */ assertBitmask(2308, ZERO | BEGIN | DECIMAL);
/**
 * @typedef {typeof NUMBER |
 *   typeof NOT_A_NUMBER |
 *   typeof BINARY |
 *   typeof DECIMAL |
 *   typeof OCTAL |
 *   typeof HEX |
 *   typeof FLOAT |
 *   typeof INTEGER |
 *   typeof BIGINT |
 *   typeof BIGINT_LITERAL_SUFFIX |
 *   typeof ZERO |
 *   typeof WHITESPACE |
 *   typeof BEGIN |
 *   typeof END |
 *   typeof LEADING_WHITESPACE |
 *   typeof TRAILING_WHITESPACE |
 *   typeof BEGIN_INTEGER_DIGITS |
 *   typeof BEGIN_FRAC_DIGITS |
 *   typeof BEGIN_BINARY |
 *   typeof BEGIN_HEX |
 *   typeof BEGIN_OCTAL |
 *   typeof BEGIN_EXPONENT |
 *   typeof FIRST_DIGIT_ZERO |
 *   typeof FIRST_DIGIT_ZERO_NOT_LEADING |
 *   LEADING_ZEROS |
 *   typeof SIGN |
 *   typeof EXPONENT_INDICATOR |
 *   typeof EXPONENT_SIGN |
 *   typeof EXPONENT_INTEGER
 * } State
 */

/**
 * @template {number} T
 * @param {T} value 
 * @param {number} bitmask 
 * @returns {T} - Returns the value if it matches the bitmask, otherwise throws an error.
 */
function assertBitmask(value, bitmask) {
    if (value !== bitmask) {
        throw new Error(`Expected bitmask ${bitmask}, but got ${value}`);
    }
    return value;
}

/**
 * @param {string} str - The string to analyze.
 * @param {Options} options - Options to control the parsing behavior.
 * @returns {number} - A bitmask representing the analysis result of the string.
 */
export function analyzeNumber(str, options) {
    let len = str.length;

    /** @type {State} */
    let state = BEGIN;
    let length = 0;
    let pos = -1;

    let result = NUMBER;

    const DECIMAL_POINT = options.decimalPoint || "\.";
    const ON_HEX = options.hex !== false ? BEGIN_HEX : NOT_A_NUMBER;
    const ON_E = options.eNotation !== false ? BEGIN_EXPONENT : NOT_A_NUMBER;
    const ON_BIGINT = options.bigint === true ? BIGINT_LITERAL_SUFFIX : NOT_A_NUMBER;
    const ON_BINARY = options.binary === true ? BEGIN_BINARY : NOT_A_NUMBER;
    const ON_OCTAL = options.octal === true ? BEGIN_OCTAL : NOT_A_NUMBER;
    const ON_LEADING_ZEROS = options.leadingZeros === false ? FIRST_DIGIT_ZERO_NOT_LEADING : FIRST_DIGIT_ZERO;

    while (++pos < len) {
        switch (str[pos]) {
            case "0":
                switch (state) {
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                        return NOT_A_NUMBER;
                    case FIRST_DIGIT_ZERO:
                        state = LEADING_ZEROS;
                        continue;
                    case LEADING_WHITESPACE:
                    case BEGIN:
                    case SIGN:
                        state = ON_LEADING_ZEROS;
                    case FLOAT:
                        ++length;
                    case BEGIN_FRAC_DIGITS:
                    case BINARY:
                    case OCTAL:
                    case DECIMAL:
                    case HEX:
                        continue;
                    case BEGIN_BINARY:
                        result |= BINARY;
                        state = BINARY;
                        continue;
                }
            case "1":
                switch (state) {
                    case BEGIN_BINARY:
                        result |= BINARY;
                        state = BINARY;
                    case BINARY:
                        continue;
                }
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
                switch (state) {
                    case BEGIN_OCTAL:
                        result |= OCTAL;
                        state = OCTAL;
                    case OCTAL:
                        continue;
                }
            case "8":
            case "9":
                switch (state) {
                    case FLOAT:
                        length = 0;
                    case DECIMAL:
                    case HEX:
                    case EXPONENT_INTEGER:
                        continue;
                    case SIGN:
                    case FIRST_DIGIT_ZERO:
                    case LEADING_ZEROS:
                    case BEGIN:
                    case LEADING_WHITESPACE:
                        state = DECIMAL;
                        continue;
                    case BEGIN_HEX:
                        result |= HEX;
                        state = HEX;
                        continue;
                    case BEGIN_EXPONENT:
                    case EXPONENT_SIGN:
                        result |= EXPONENT_INTEGER;
                        state = EXPONENT_INTEGER;
                        continue;
                    case BEGIN_FRAC_DIGITS:
                        result |= FLOAT;
                        state = FLOAT;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "a":
            case "c":
            case "d":
            case "f":
            case "A":
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
                        return NOT_A_NUMBER;
                }
            case "b":
            case "B":
                switch (state) {
                    case BEGIN_HEX:
                        result |= HEX;
                        state = HEX;
                    case HEX:
                        continue;
                    case FIRST_DIGIT_ZERO:
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                        state = ON_BINARY;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "e":
            case "E":
                switch (state) {
                    case BEGIN_HEX:
                        result |= HEX;
                        state = HEX;
                        continue;
                    case FIRST_DIGIT_ZERO:
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                    case DECIMAL:
                    case BEGIN_FRAC_DIGITS:
                    case FLOAT:
                        result |= EXPONENT_INDICATOR;
                        state = ON_E;
                    case HEX:
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "+":
            case "-":
                switch (state) {
                    case BEGIN:
                    case LEADING_WHITESPACE:
                        result |= SIGN;
                        state = SIGN;
                        continue;
                    case BEGIN_EXPONENT:
                        state = EXPONENT_SIGN;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case DECIMAL_POINT:
                switch (state) {
                    case BEGIN:
                    case LEADING_WHITESPACE:
                    case SIGN:
                    case FIRST_DIGIT_ZERO:
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                    case LEADING_ZEROS:
                    case DECIMAL:
                        state = BEGIN_FRAC_DIGITS;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "x":
            case "X":
                switch (state) {
                    case FIRST_DIGIT_ZERO:
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                        state = ON_HEX;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "o":
            case "O":
                switch (state) {
                    case FIRST_DIGIT_ZERO:
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                        state = ON_OCTAL;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "n":
                switch (state) {
                    case DECIMAL:
                        result |= BIGINT;
                        state = ON_BIGINT;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#white_space
            case " ":
            case "\t":
            case "\v":
            case "\f":
            case "\r":
            case "\n":
            case "\ufeff": // Unicode line separator
            // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7BGeneral_Category%3DSpace_Separator%7D
            case "\u00A0": // Non-breaking space
            case "\u1680": // Ogham space mark
            case "\u2000": // En quad
            case "\u2001": // Em quad
            case "\u2002": // En space
            case "\u2003": // Em space
            case "\u2004": // Three-per-em space
            case "\u2005": // Four-per-em space
            case "\u2006": // Six-per-em space
            case "\u2007": // Figure space
            case "\u2008": // Punctuation space
            case "\u2009": // Thin space
            case "\u200A": // Hair space
            case "\u202F": // Narrow no-break space
            case "\u205F": // Medium mathematical space
            case "\u3000": // Ideographic space
                switch (state) {
                    case BEGIN:
                        result |= WHITESPACE;
                        state = LEADING_WHITESPACE;
                        continue;
                    case BINARY:
                    case OCTAL:
                    case DECIMAL:
                    case HEX:
                    case EXPONENT_INTEGER:
                    case BIGINT_LITERAL_SUFFIX:
                    case FLOAT:
                        result |= WHITESPACE;
                        state = TRAILING_WHITESPACE;
                    case LEADING_WHITESPACE:
                    case TRAILING_WHITESPACE:
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            default:
                return NOT_A_NUMBER;
        }
    }

    switch (state) {
        case BINARY:
        case OCTAL:
        case DECIMAL:
        case HEX:
        case FLOAT:
        case LEADING_ZEROS:
        case BIGINT_LITERAL_SUFFIX:
        case EXPONENT_INTEGER:
        case FIRST_DIGIT_ZERO:
        case FIRST_DIGIT_ZERO_NOT_LEADING:
        case LEADING_ZEROS:
        case BEGIN_FRAC_DIGITS:
        case TRAILING_WHITESPACE:
            return result;
        default:
            return NOT_A_NUMBER;
    }
}
