const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
const numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;

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
 * @template {*} T
 * @param {T} str 
 * @param {Options} options 
 * @returns {number|T}
 */
export default function toNumber(str, options = {}) {
    options = Object.assign({}, defaultOptions, options);
    if (!str || typeof str !== "string") return str;

    let trimmedStr = str.trim();

    if (options.skipLike !== undefined && options.skipLike.test(trimmedStr)) return str;
    else if (str === "0") return 0;
    else if (options.hex && hexRegex.test(trimmedStr)) {
        return parse_int(trimmedStr, 16);
    } else if (trimmedStr.search(/.+[eE].+/) !== -1) { //eNotation
        return resolveEnotation(str, trimmedStr, options);
    } else {
        //separate negative sign, leading zeros, and rest number
        const match = numRegex.exec(trimmedStr);
        // +00.123 => [ , '+', '00', '.123', ..
        if (match) {
            const sign = match[1] || "";
            const leadingZeros = match[2];
            let numTrimmedByZeros = trimZeros(match[3]); //complete num without leading zeros
            const decimalAdjacentToLeadingZeros = sign ? // 0., -00., 000.
                str[leadingZeros.length + 1] === "."
                : str[leadingZeros.length] === ".";

            //trim ending zeros for floating number
            if (!options.leadingZeros //leading zeros are not allowed
                && (leadingZeros.length > 1
                    || (leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros))) {
                // 00, 00.3, +03.24, 03, 03.24
                return str;
            }
            else {//no leading zeros or leading zeros are allowed
                const num = Number(trimmedStr);
                const parsedStr = String(num);

                if (num === 0) return num;
                if (parsedStr.search(/[eE]/) !== -1) { //given number is long and parsed to eNotation
                    if (options.eNotation) return num;
                    else return str;
                } else if (trimmedStr.indexOf(".") !== -1) { //floating number
                    if (parsedStr === "0") return num; //0.0
                    else if (parsedStr === numTrimmedByZeros) return num; //0.456. 0.79000
                    else if (parsedStr === `${sign}${numTrimmedByZeros}`) return num;
                    else return str;
                }

                let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
                if (leadingZeros) {
                    // -009 => -9
                    return (n === parsedStr) || (sign + n === parsedStr) ? num : str
                } else {
                    // +9
                    return (n === parsedStr) || (n === sign + parsedStr) ? num : str
                }
            }
        } else { //non-numeric string
            return str;
        }
    }
}

const eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;

/**
 * @template {*} T
 * @param {T} str 
 * @param {string} trimmedStr 
 * @param {Options} options 
 * @returns {number|T}
 */
function resolveEnotation(str, trimmedStr, options) {
    if (!options.eNotation) return str;
    const notation = trimmedStr.match(eNotationRegx);
    if (notation) {
        let sign = notation[1] || "";
        const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
        const leadingZeros = notation[2];
        const eAdjacentToLeadingZeros = sign ? // 0E.
            str[leadingZeros.length + 1] === eChar
            : str[leadingZeros.length] === eChar;

        if (leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str;
        else if (leadingZeros.length === 1
            && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) {
            return Number(trimmedStr);
        } else if (options.leadingZeros && !eAdjacentToLeadingZeros) { //accept with leading zeros
            //remove leading 0s
            trimmedStr = (notation[1] || "") + notation[3];
            return Number(trimmedStr);
        } else return str;
    } else {
        return str;
    }
}

/**
 * @param {string} numStr without leading zeros
 * @returns {string} numStr with trimmed ending zeros
 */
function trimZeros(numStr) {
    if (numStr && numStr.indexOf(".") !== -1) {//float
        numStr = numStr.replace(/0+$/, ""); //remove ending zeros
        if (numStr === ".") numStr = "0";
        else if (numStr[0] === ".") numStr = "0" + numStr;
        else if (numStr[numStr.length - 1] === ".") numStr = numStr.substring(0, numStr.length - 1);
        return numStr;
    }
    return numStr;
}

/**
 * @type {(string: string, radix: 16) => number}
 */
const parse_int = ((function parse_int() {
    if (parseInt) return parseInt
    else if (Number.parseInt) return Number.parseInt
    else if (window && window.parseInt) return window.parseInt
    else return function parseInt() {
        throw new Error("parseInt, Number.parseInt, window.parseInt are not supported")
    };
})());
