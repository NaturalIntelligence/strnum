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
    export type State = typeof NUMBER | typeof NOT_A_NUMBER | typeof BINARY | typeof DECIMAL | typeof OCTAL | typeof HEX | typeof FLOAT | typeof INTEGER | typeof BIGINT | typeof BIGINT_LITERAL_SUFFIX | typeof ZERO | typeof WHITESPACE | typeof BEGIN | typeof END | typeof LEADING_WHITESPACE | typeof TRAILING_WHITESPACE | typeof BEGIN_INTEGER_DIGITS | typeof BEGIN_FRAC_DIGITS | typeof BEGIN_BINARY | typeof BEGIN_HEX | typeof BEGIN_OCTAL | typeof BEGIN_EXPONENT | typeof BEGIN_ZERO | typeof FIRST_DIGIT_ZERO_NOT_LEADING | typeof LEADING_ZEROS | typeof INFINITY | typeof SIGN | typeof EXPONENT_INDICATOR | typeof EXPONENT_SIGN | typeof EXPONENT_INTEGER;
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
         * - Whether to allow "Infinity" and "-Infinity".
         */
        infinity?: boolean;
        /**
         * - A regular expression to skip certain string patterns.
         */
        skipLike?: RegExp;
        /**
         * - Whether to allow scientific notation (e.g., "1e10").
         */
        eNotation?: boolean;
        /**
         * - Whether to treat empty strings or strings with whitespace as zero.
         */
        empty?: boolean;
        /**
         * - Whether to return NaN for non-numeric values.
         */
        NaN?: boolean;
        /**
         * - Whether to convert boolean values to numbers (true to 1, false to 0).
         */
        boolean?: boolean;
        /**
         * - Whether to convert null to 0.
         */
        null?: boolean;
        /**
         * - Whether to force IEEE 754 compliance for floating-point numbers.
         */
        ieee754?: boolean;
    };
    const NUMBER: 0;
    const NOT_A_NUMBER: 1;
    const BINARY: 2;
    const DECIMAL: 4;
    const OCTAL: 8;
    const HEX: 16;
    const FLOAT: 32;
    const INTEGER: 64;
    const BIGINT: 128;
    const BIGINT_LITERAL_SUFFIX: 8192;
    const ZERO: 2048;
    const WHITESPACE: 512;
    const BEGIN: 16384;
    const END: 32768;
    const LEADING_WHITESPACE: 16896;
    const TRAILING_WHITESPACE: 33280;
    const BEGIN_INTEGER_DIGITS: 16388;
    const BEGIN_FRAC_DIGITS: 16416;
    const BEGIN_BINARY: 16386;
    const BEGIN_HEX: 16400;
    const BEGIN_OCTAL: 16392;
    const BEGIN_EXPONENT: 20480;
    const BEGIN_ZERO: 18432;
    const FIRST_DIGIT_ZERO_NOT_LEADING: 51200;
    const LEADING_ZEROS: 18436;
    const INFINITY: 256;
    const SIGN: 1024;
    const EXPONENT_INDICATOR: 4096;
    const EXPONENT_SIGN: 5120;
    const EXPONENT_INTEGER: 4160;
    export {};
}
