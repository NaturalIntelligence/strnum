declare module "strnum" {
    /**
     * @template {*} T
     * @param {T} str - The string to convert to a number.
     * @param {Options} [options] - Options to control the conversion behavior.
     * @returns {number|T} - The converted number or the original value if conversion is not applicable.
     */
    export default function toNumber<T extends unknown>(str: T, options?: Options): number | T;
    /**
     * @param {string} str - The string to analyze.
     * @param {Options} options - Options to control the parsing behavior.
     * @returns {number} - A bitmask representing the analysis result of the string.
     */
    export function analyzeNumber(str: string, options: Options): number;
    export type State = typeof NUMBER | typeof NOT_A_NUMBER | typeof BINARY | typeof DECIMAL | typeof OCTAL | typeof HEX | typeof FLOAT | typeof INTEGER | typeof BIGINT | typeof BIGINT_LITERAL_SUFFIX | typeof ZERO | typeof WHITESPACE | typeof BEGIN | typeof END | typeof LEADING_WHITESPACE | typeof TRAILING_WHITESPACE | typeof BEGIN_INTEGER_DIGITS | typeof BEGIN_FRAC_DIGITS | typeof BEGIN_BINARY | typeof BEGIN_HEX | typeof BEGIN_OCTAL | typeof BEGIN_EXPONENT | typeof FIRST_DIGIT_ZERO | typeof FIRST_DIGIT_ZERO_NOT_LEADING | 2308 | typeof SIGN | typeof EXPONENT_INDICATOR | typeof EXPONENT_SIGN | typeof EXPONENT_INTEGER;
    export type Options = {
        /**
         * - Whether to allow hexadecimal numbers (e.g., "0x1A").
         */
        hex?: boolean;
        /**
         * - Whether to allow octal numbers (e.g., "0o17").
         */
        octal?: boolean;
        /**
         * - Whether to allow binary numbers (e.g., "0b1010").
         */
        binary?: boolean;
        /**
         * - Whether to allow BigInt numbers (e.g., "123n").
         */
        bigint?: boolean;
        /**
         * - Whether to allow leading zeros in numbers.
         */
        leadingZeros?: boolean;
        /**
         * - A regular expression to skip certain string patterns.
         */
        skipLike?: RegExp;
        /**
         * - The character used as the decimal point.
         */
        decimalPoint?: string;
        /**
         * - Whether to allow scientific notation (e.g., "1e10").
         */
        eNotation?: boolean;
    };
    const NUMBER: 0;
    const NOT_A_NUMBER: 1;
    const BINARY: 2;
    const DECIMAL: 4;
    const OCTAL: 8;
    const HEX: 16;
    const FLOAT: 32;
    const INTEGER: 64;
    const BIGINT: 2112;
    const BIGINT_LITERAL_SUFFIX: 2048;
    const ZERO: 256;
    const WHITESPACE: 128;
    const BEGIN: 2048;
    const END: 4096;
    const LEADING_WHITESPACE: 2176;
    const TRAILING_WHITESPACE: 4224;
    const BEGIN_INTEGER_DIGITS: 2052;
    const BEGIN_FRAC_DIGITS: 2080;
    const BEGIN_BINARY: 2050;
    const BEGIN_HEX: 2064;
    const BEGIN_OCTAL: 2056;
    const BEGIN_EXPONENT: 3072;
    const FIRST_DIGIT_ZERO: 2304;
    const FIRST_DIGIT_ZERO_NOT_LEADING: 6400;
    const SIGN: 512;
    const EXPONENT_INDICATOR: 1024;
    const EXPONENT_SIGN: 1536;
    const EXPONENT_INTEGER: 1088;
    export {};
}
