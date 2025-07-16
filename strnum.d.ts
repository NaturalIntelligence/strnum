declare module "strnum" {
    /**
     * @template {*} T
     * @param {T} str - The string to convert to a number.
     * @param {Options} [options] - Options to control the conversion behavior.
     * @returns {number|T} - The converted number or the original value if conversion is not applicable.
     */
    export default function toNumber<T extends unknown>(str: T, options?: Options): number | T;
    export type Options = {
        /**
         * - Whether to allow hexadecimal numbers (e.g., "0x1A").
         */
        hex?: boolean;
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
}
