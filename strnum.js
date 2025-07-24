/**
 * @typedef {Object} Options
 * @property {boolean} [hex=true] - Whether to allow hexadecimal numbers (e.g., "0x1A").
 * @property {boolean} [octal=false] - Whether to allow octal numbers (e.g., "0o17").
 * @property {boolean} [binary=false] - Whether to allow binary numbers (e.g., "0b1010").
 * @property {boolean} [bigint=false] - Whether to allow BigInt numbers (e.g., "123n").
 * @property {boolean} [leadingZeros=true] - Whether to allow leading zeros in numbers (e.g., "000123").
 * @property {boolean} [infinity=false] - Whether to allow "Infinity" and "-Infinity".
 * @property {RegExp} [skipLike] - A regular expression to skip certain string patterns.
 * @property {boolean} [eNotation=true] - Whether to allow scientific notation (e.g., "1e10").
 * @property {boolean} [empty=false] - Whether to treat empty strings or strings with whitespace as zero (e.g., " ").
 * @property {boolean} [NaN=false] - Whether to return NaN for non-numeric values, (e.g., "abc" => NaN).
 * @property {boolean} [boolean=false] - Whether to convert boolean values to numbers (true to 1, false to 0).
 * @property {boolean} [null=false] - Whether to convert null to 0.
 * @property {boolean} [ieee754=false] - Whether to force IEEE 754 compliance for floating-point numbers (e.g. "1234567890.1234567890" => 1234567890.1234567).
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
    if (typeof str !== "string") {
        if (options.boolean === true) {
            if (str === true) return 1;
            else if (str === false) return 0;
        }
        if (options.null === true) {
            if (str === null) return 0;
        }
        return str;
    }

    const analyzeResult = analyzeNumber(str, options);

    if ((analyzeResult & NOT_A_NUMBER) === NOT_A_NUMBER) {
        if (options.NaN === true) {
            return NaN;
        }
        return str;
    }

    let trimmedStr;

    if (options.skipLike !== undefined) {
        trimmedStr = ((analyzeResult & WHITESPACE) === WHITESPACE)
            ? str.trim()
            : str;
        if (options.skipLike.test(trimmedStr)) {
            return str;
        }
    }

    if ((analyzeResult & ZERO) === ZERO) {
        return 0;
    }

    if ((analyzeResult & INFINITY) === INFINITY) {
        return analyzeResult & NEGATIVE ? -Infinity : Infinity;
    }

    let num;
    if ((analyzeResult & SIGN) === 0) {
        num = +str;
    } else if ((analyzeResult & HEX) === HEX) {
        num = parse_int(str, 16);
    } else if ((analyzeResult & REMOVE_TYPE_HINT) !== 0) {
        if (trimmedStr === undefined) {
            if ((analyzeResult & WHITESPACE) === WHITESPACE) {
                trimmedStr = str.trim();
            } else {
                trimmedStr = str;
            }
        }
        num = +trimmedStr.slice(1);
        if (analyzeResult & NEGATIVE) {
            num = -num;
        }
        return num;
    } else {
        num = (analyzeResult & INTEGER) === INTEGER ? parse_int(str, 10) : +str;
    }

    if ((analyzeResult & EXPONENT_INDICATOR) === EXPONENT_INDICATOR) {
        if (options.eNotation !== false) {
            return +str;
        }
        return str;
    }

    const parsedStr = '' + num;

    if (parsedStr.indexOf(EXP_CHAR) !== -1) {
        if (options.eNotation !== false) return num;
        else return str;
    }

    // If the number is out of safe integer range, return the original string
    if (((analyzeResult & FLOAT) !== FLOAT) && Number.isSafeInteger(num) === false) {
        return str;
    }

    if ((analyzeResult & FLOAT) === FLOAT) {
        if (options.ieee754 === true) {
            return num;
        }
        const parsedDecimalPoint = parsedStr.indexOf(".") + 1;

        // If the parsed number has fewer than 14 digits after the decimal point,
        // we can safely return it as a number.
        if ((parsedStr.length - parsedDecimalPoint) < 14) {
            return num;
        }

        const strDecimalPoint = str.indexOf(".") + 1;

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
                case "\u2028": // Line separator
                case "\u2029": // Paragraph separator
                case "\u202F": // Narrow no-break space
                case "\u205F": // Medium mathematical space
                case "\u3000": // Ideographic space
                    continue;
                default:
                    return str;
            }
        }
    }

    return num;
}

const NUMBER =                       /** @type {const} */ 0b00000000000000000;
const NOT_A_NUMBER =                 /** @type {const} */ 0b00000000000000001;

const BINARY =                       /** @type {const} */ 0b00000000000000010;
const DECIMAL =                      /** @type {const} */ 0b00000000000000100;
const OCTAL =                        /** @type {const} */ 0b00000000000001000;
const HEX =                          /** @type {const} */ 0b00000000000010000;

const FLOAT =                        /** @type {const} */ 0b00000000000100000;
const INTEGER =                      /** @type {const} */ 0b00000000001000000;
const BIGINT =                       /** @type {const} */ 0b00000000010000000;
const INFINITY =                     /** @type {const} */ 0b00000000100000000;

// Special character codes
const WHITESPACE =                   /** @type {const} */ 0b00000001000000000;
const SIGN =                         /** @type {const} */ 0b00000010000000000;
const ZERO =                         /** @type {const} */ 0b00000100000000000;
const EXPONENT_INDICATOR =           /** @type {const} */ 0b00001000000000000; // 'e' or 'E'

// Positional constants
const BEGIN =                        /** @type {const} */ 0b00010000000000000;
const END =                          /** @type {const} */ 0b00100000000000000;

const NEGATIVE =                     /** @type {const} */ 0b01000000000000000;

const LEADING_WHITESPACE =           /** @type {const} */ assertBitmask(8704, BEGIN | WHITESPACE);
const TRAILING_WHITESPACE =          /** @type {const} */ assertBitmask(16896, END | WHITESPACE);

const BEGIN_INTEGER_DIGITS =         /** @type {const} */ assertBitmask(8196, BEGIN | DECIMAL);
const BEGIN_FRAC_DIGITS =            /** @type {const} */ assertBitmask(8224, BEGIN | FLOAT);
const BEGIN_HEX =                    /** @type {const} */ assertBitmask(8208, BEGIN | HEX);
const BEGIN_OCTAL =                  /** @type {const} */ assertBitmask(8200, BEGIN | OCTAL);
const BEGIN_BINARY =                 /** @type {const} */ assertBitmask(8194, BEGIN | BINARY);

const BEGIN_EXPONENT =               /** @type {const} */ assertBitmask(12288, EXPONENT_INDICATOR | BEGIN);
const EXPONENT_SIGN =                /** @type {const} */ assertBitmask(5120, EXPONENT_INDICATOR | SIGN);
const EXPONENT_DECIMAL =             /** @type {const} */ assertBitmask(4100, EXPONENT_INDICATOR | DECIMAL);

const BEGIN_ZERO =                   /** @type {const} */ assertBitmask(10240, BEGIN | ZERO);
const FIRST_DIGIT_ZERO_NOT_LEADING = /** @type {const} */ assertBitmask(26624, ZERO | BEGIN | END);
const LEADING_ZEROS =                /** @type {const} */ assertBitmask(10244, ZERO | BEGIN | DECIMAL);

const REMOVE_TYPE_HINT =             /** @type {const} */ assertBitmask(10, BINARY | OCTAL);

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
 *   typeof BEGIN_ZERO |
 *   typeof FIRST_DIGIT_ZERO_NOT_LEADING |
 *   typeof LEADING_ZEROS |
 *   typeof INFINITY |
 *   typeof SIGN |
 *   typeof EXPONENT_INDICATOR |
 *   typeof EXPONENT_SIGN |
 *   typeof EXPONENT_DECIMAL
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

    const ON_HEX = options.hex !== false ? BEGIN_HEX : NOT_A_NUMBER;
    const ON_E = options.eNotation !== false ? BEGIN_EXPONENT : NOT_A_NUMBER;
    const ON_BIGINT = options.bigint === true ? BIGINT : NOT_A_NUMBER;
    const ON_BINARY = options.binary === true ? BEGIN_BINARY : NOT_A_NUMBER;
    const ON_OCTAL = options.octal === true ? BEGIN_OCTAL : NOT_A_NUMBER;
    const ON_LEADING_ZEROS = options.leadingZeros === false ? FIRST_DIGIT_ZERO_NOT_LEADING : BEGIN_ZERO;
    const ON_INFINITY = options.infinity === true ? INFINITY : NOT_A_NUMBER;
    const ON_EMPTY = options.empty === true ? ZERO : NOT_A_NUMBER;

    while (++pos < len) {
        switch (str[pos]) {
            case "0":
                switch (state) {
                    case FLOAT:
                        ++length;
                    case DECIMAL:
                    case HEX:
                    case BINARY:
                    case OCTAL:
                    case BEGIN_FRAC_DIGITS:
                        continue;
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                        return NOT_A_NUMBER;
                    case BEGIN_ZERO:
                        state = LEADING_ZEROS;
                        continue;
                    case LEADING_WHITESPACE:
                    case BEGIN:
                    case SIGN:
                        state = ON_LEADING_ZEROS;
                        continue;
                    case BEGIN_BINARY:
                        result |= BINARY;
                        state = BINARY;
                        continue;
                }
            case "1":
                switch (state) {
                    case BINARY:
                        continue;
                    case BEGIN_BINARY:
                        result |= BINARY;
                        state = BINARY;
                        continue;
                }
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
                switch (state) {
                    case OCTAL:
                        continue;
                    case BEGIN_OCTAL:
                        result |= OCTAL;
                        state = OCTAL;
                        continue;
                }
            case "8":
            case "9":
                switch (state) {
                    case FLOAT:
                        length = 0;
                    case DECIMAL:
                    case HEX:
                    case EXPONENT_DECIMAL:
                        continue;
                    case SIGN:
                    case BEGIN_ZERO:
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
                        state = EXPONENT_DECIMAL;
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
                    case HEX:
                        continue;
                    case BEGIN_HEX:
                        result |= HEX;
                        state = HEX;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "b":
            case "B":
                switch (state) {
                    case HEX:
                        continue;
                    case BEGIN_HEX:
                        result |= HEX;
                        state = HEX;
                        continue;
                    case BEGIN_ZERO:
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                        state = ON_BINARY;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "e":
            case "E":
                switch (state) {
                    case HEX:
                        continue;
                    case BEGIN_HEX:
                        result |= HEX;
                        state = HEX;
                        continue;
                    case BEGIN_ZERO:
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                    case DECIMAL:
                    case BEGIN_FRAC_DIGITS:
                    case FLOAT:
                        result |= EXPONENT_INDICATOR;
                        state = ON_E;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "-":
                switch (state) {
                    case BEGIN:
                    case LEADING_WHITESPACE:
                        result |= SIGN;
                        result |= NEGATIVE;
                        state = SIGN;
                        continue;
                    case BEGIN_EXPONENT:
                        state = EXPONENT_SIGN;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "+":
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
            case ".":
                switch (state) {
                    case BEGIN:
                    case LEADING_WHITESPACE:
                    case SIGN:
                    case BEGIN_ZERO:
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
                    case BEGIN_ZERO:
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                        state = ON_HEX;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case "o":
            case "O":
                switch (state) {
                    case BEGIN_ZERO:
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
            case "I":
                switch (state) {
                    case BEGIN:
                    case LEADING_WHITESPACE:
                    case SIGN:
                        if (
                            str[++pos] === "n" &&
                            str[++pos] === "f" &&
                            str[++pos] === "i" &&
                            str[++pos] === "n" &&
                            str[++pos] === "i" &&
                            str[++pos] === "t" &&
                            str[++pos] === "y"
                        ) {
                            result |= INFINITY;
                            state = ON_INFINITY;
                            continue;
                        }
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
            case "\u2028": // Line separator
            case "\u2029": // Paragraph separator
            case "\u202F": // Narrow no-break space
            case "\u205F": // Medium mathematical space
            case "\u3000": // Ideographic space
                switch (state) {
                    case LEADING_WHITESPACE:
                    case TRAILING_WHITESPACE:
                        continue;
                    case BEGIN:
                        result |= WHITESPACE;
                        state = LEADING_WHITESPACE;
                        continue;
                    case BINARY:
                    case OCTAL:
                    case DECIMAL:
                    case HEX:
                    case EXPONENT_DECIMAL:
                    case BIGINT:
                    case FLOAT:
                    case INFINITY:
                        result |= WHITESPACE;
                        state = TRAILING_WHITESPACE;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            default:
                return NOT_A_NUMBER;
        }
    }

    switch (state) {
        case BEGIN_ZERO:
        case FIRST_DIGIT_ZERO_NOT_LEADING:
        case LEADING_ZEROS:
            result |= ZERO;
        case EXPONENT_DECIMAL:
        case BINARY:
        case OCTAL:
        case DECIMAL:
        case HEX:
        case FLOAT:
        case BIGINT:
        case BEGIN_FRAC_DIGITS:
        case TRAILING_WHITESPACE:
        case INFINITY:
            return result;
        case BEGIN:
        case LEADING_WHITESPACE:
            result |= ON_EMPTY;
            return result;
        default:
            return NOT_A_NUMBER;
    }
}
