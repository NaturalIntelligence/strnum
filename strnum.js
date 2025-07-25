/**
 * @typedef {Object} Options
 * @property {boolean} [hex=true] - Whether to allow hexadecimal numbers (e.g., "0x1A").
 * @property {boolean} [octal=false] - Whether to allow octal numbers (e.g., "0o17").
 * @property {boolean} [binary=false] - Whether to allow binary numbers (e.g., "0b1010").
 * @property {boolean} [bigint=false] - Whether to allow BigInt numbers (e.g., "123n").
 * @property {boolean} [leadingZeros=true] - Whether to allow leading zeros in numbers (e.g., "000123").
 * @property {boolean} [safeInteger=true] - Whether to check if the number is a safe integer.
 * @property {boolean} [infinity=false] - Whether to allow "Infinity" and "-Infinity".
 * @property {RegExp} [skipLike] - A regular expression to skip certain string patterns.
 * @property {boolean} [eNotation=true] - Whether to allow scientific notation (e.g., "1e10").
 * @property {boolean} [empty=false] - Whether to treat empty strings or strings with whitespace as zero (e.g., " ").
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

/** @type {(string: string, radix?: 2|8|10|16) => number} */
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
    if (!str || typeof str !== "string") {
        return str;
    }

    const analyzeResult = analyzeNumber(str, options);

    if ((analyzeResult & NOT_A_NUMBER) === NOT_A_NUMBER) {
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
    if ((analyzeResult & BIGINT) === BIGINT) {
        num = parse_int(str);
    } else if ((analyzeResult & SIGN) === 0) {
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
        if ((analyzeResult & NEGATIVE) === NEGATIVE) {
            num = -num;
        }
    } else {
        num = +str;
    }

    if ((analyzeResult & EXPONENT_INDICATOR) === EXPONENT_INDICATOR) {
        return num;
    }

    // If the number is out of safe integer range, return the original string
    if (((analyzeResult & FLOAT) !== FLOAT)) {
        if (options.safeInteger !== false && Number.isSafeInteger(num) === false) {
            return str;
        }

        if (options.eNotation === false && ('' + num).indexOf(EXP_CHAR) !== -1) {
            // If the number is in scientific notation, return the original string
            return str;
        }

        return num;
    } else {
        if (options.ieee754 === true) {
            return num;
        }

        const parsedStr = '' + num;
        const parsedDecimalPoint = parsedStr.indexOf(".") + 1;
        const parsedStrLength = parsedStr.length;

        // If the parsed number has fewer than 14 digits after the decimal point,
        // we can safely return it as a number.
        if ((parsedStrLength - parsedDecimalPoint) < 14) {
            return num;
        }

        const strDecimalPoint = str.indexOf(".") + 1;

        let i = 0;
        const parsedFracLength = parsedStrLength - parsedDecimalPoint;
        for (; i < parsedFracLength; i++) {
            if (parsedStr[parsedDecimalPoint + i] !== str[strDecimalPoint + i]) {
                return str;
            }
        }

        // ignore trailing zeros and whitespace in the fractional part
        i += strDecimalPoint;
        while (i++ < str.length) {
            switch (str.charCodeAt(i)) {
                case 0x30: // '0'
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#white_space
                case 0x20: // ' '
                case 0x09: // '\t'
                case 0x0b: // '\v'
                case 0x0c: // '\f'
                case 0x0d: // '\r'
                case 0x0a: // '\n'
                case 0xFEFF: // '\ufeff' (Unicode line separator)
                // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7BGeneral_Category%3DSpace_Separator%7D
                case 0xA0: // Non-breaking space
                case 0x1680: // Ogham space mark
                case 0x2000: // En quad
                case 0x2001: // Em quad
                case 0x2002: // En space
                case 0x2003: // Em space
                case 0x2004: // Three-per-em space
                case 0x2005: // Four-per-em space
                case 0x2006: // Six-per-em space
                case 0x2007: // Figure space
                case 0x2008: // Punctuation space
                case 0x2009: // Thin space
                case 0x200A: // Hair space
                case 0x2028: // Line separator
                case 0x2029: // Paragraph separator
                case 0x202F: // Narrow no-break space
                case 0x205F: // Medium mathematical space
                case 0x3000: // Ideographic space
                    continue;
                default:
                    return str;
            }
        }
        return num;
    }
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

const LEADING_WHITESPACE =           /** @type {const} */ assertBitmask(8705, BEGIN | WHITESPACE | NOT_A_NUMBER);
const TRAILING_WHITESPACE =          /** @type {const} */ assertBitmask(16896, END | WHITESPACE);

const BEGIN_FRAC_DIGITS =            /** @type {const} */ assertBitmask(8224, BEGIN | FLOAT);
const BEGIN_HEX =                    /** @type {const} */ assertBitmask(8209, BEGIN | HEX | NOT_A_NUMBER);
const BEGIN_OCTAL =                  /** @type {const} */ assertBitmask(8201, BEGIN | OCTAL | NOT_A_NUMBER);
const BEGIN_BINARY =                 /** @type {const} */ assertBitmask(8195, BEGIN | BINARY | NOT_A_NUMBER);

const BEGIN_EXPONENT =               /** @type {const} */ assertBitmask(12289, EXPONENT_INDICATOR | BEGIN | NOT_A_NUMBER);
const EXPONENT_SIGN =                /** @type {const} */ assertBitmask(5121, EXPONENT_INDICATOR | SIGN | NOT_A_NUMBER);
const EXPONENT =             /** @type {const} */ assertBitmask(4100, EXPONENT_INDICATOR | DECIMAL);

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
 *   typeof EXPONENT
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
    let pos = -1;

    let result = NUMBER;

    const ON_HEX = options.hex !== false ? BEGIN_HEX : NOT_A_NUMBER;
    const ON_E = options.eNotation !== false ? BEGIN_EXPONENT : NOT_A_NUMBER;
    const ON_BIGINT = options.bigint === true ? BIGINT : NOT_A_NUMBER;
    const ON_BINARY = options.binary === true ? BEGIN_BINARY : NOT_A_NUMBER;
    const ON_OCTAL = options.octal === true ? BEGIN_OCTAL : NOT_A_NUMBER;
    const ON_LEADING_ZEROS = options.leadingZeros === false ? FIRST_DIGIT_ZERO_NOT_LEADING : BEGIN_ZERO;
    const ON_INFINITY = options.infinity === true ? INFINITY : NOT_A_NUMBER;

    while (++pos < len) {
        switch (str.charCodeAt(pos)) {
            case 0x30: // '0'
                switch (state) {
                    case FLOAT:
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
            case 0x31: // '1'
                switch (state) {
                    case BINARY:
                        continue;
                    case BEGIN_BINARY:
                        result |= BINARY;
                        state = BINARY;
                        continue;
                }
            case 0x32: // '2'
            case 0x33: // '3'
            case 0x34: // '4'
            case 0x35: // '5'
            case 0x36: // '6'
            case 0x37: // '7'
                switch (state) {
                    case OCTAL:
                        continue;
                    case BEGIN_OCTAL:
                        result |= OCTAL;
                        state = OCTAL;
                        continue;
                }
            case 0x38: // '8'
            case 0x39: // '9'
                switch (state) {
                    case FLOAT:
                    case DECIMAL:
                    case HEX:
                    case EXPONENT:
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
                        state = EXPONENT;
                        continue;
                    case BEGIN_FRAC_DIGITS:
                        result |= FLOAT;
                        state = FLOAT;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case 0x61: // 'a'
            case 0x63: // 'c'
            case 0x64: // 'd'
            case 0x66: // 'f'
            case 0x41: // 'A'
            case 0x43: // 'C'
            case 0x44: // 'D'
            case 0x46: // 'F'
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
            case 0x62: // 'b'
            case 0x42: // 'B'
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
            case 0x65: // 'e'
            case 0x45: // 'E'
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
            case 0x2D: // '-'
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
            case 0x2B: // '+'
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
            case 0x2E: // '.'
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
            case 0x78: // 'x'
            case 0x58: // 'X'
                switch (state) {
                    case BEGIN_ZERO:
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                        state = ON_HEX;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case 0x6F: // 'o'
            case 0x4F: // 'O'
                switch (state) {
                    case BEGIN_ZERO:
                    case FIRST_DIGIT_ZERO_NOT_LEADING:
                        state = ON_OCTAL;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case 0x6E: // 'n'
                switch (state) {
                    case DECIMAL:
                        result |= BIGINT;
                        state = ON_BIGINT;
                        continue;
                    default:
                        return NOT_A_NUMBER;
                }
            case 0x49: // 'I'
                switch (state) {
                    case BEGIN:
                    case LEADING_WHITESPACE:
                    case SIGN:
                        if (
                            str.charCodeAt(++pos) === 0x6E && // 'n'
                            str.charCodeAt(++pos) === 0x66 && // 'f'
                            str.charCodeAt(++pos) === 0x69 && // 'i'
                            str.charCodeAt(++pos) === 0x6E && // 'n'
                            str.charCodeAt(++pos) === 0x69 && // 'i'
                            str.charCodeAt(++pos) === 0x74 && // 't'
                            str.charCodeAt(++pos) === 0x79 // 'y'
                        ) {
                            result |= INFINITY;
                            state = ON_INFINITY;
                            continue;
                        }
                    default:
                        return NOT_A_NUMBER;
                }
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#white_space
            case 0x20: // ' '
            case 0x09: // '\t'
            case 0x0b: // '\v'
            case 0x0c: // '\f'
            case 0x0d: // '\r'
            case 0x0a: // '\n'
            case 0xFEFF: // '\ufeff' (Unicode line separator)
            // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7BGeneral_Category%3DSpace_Separator%7D
            case 0xA0: // Non-breaking space
            case 0x1680: // Ogham space mark
            case 0x2000: // En quad
            case 0x2001: // Em quad
            case 0x2002: // En space
            case 0x2003: // Em space
            case 0x2004: // Three-per-em space
            case 0x2005: // Four-per-em space
            case 0x2006: // Six-per-em space
            case 0x2007: // Figure space
            case 0x2008: // Punctuation space
            case 0x2009: // Thin space
            case 0x200A: // Hair space
            case 0x2028: // Line separator
            case 0x2029: // Paragraph separator
            case 0x202F: // Narrow no-break space
            case 0x205F: // Medium mathematical space
            case 0x3000: // Ideographic space
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
                    case EXPONENT:
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

    if (state & NOT_A_NUMBER) {
        return NOT_A_NUMBER;
    } else if (state & ZERO) {
        return result | ZERO;
    }
    return result;
}
