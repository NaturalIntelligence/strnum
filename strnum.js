const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
const numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
// const octRegex = /^0x[a-z0-9]+/;
// const binRegex = /0x[a-z0-9]+/;

 
const consider = {
    hex :  true,
    // oct: false,
    leadingZeros: true,
    decimalPoint: "\.",
    eNotation: true,
    //skipLike: /regex/
};

export default function toNumber(str, options = {}){
    options = Object.assign({}, consider, options );
    if(!str || typeof str !== "string" ) return str;
    
    let trimmedStr  = str.trim();
    
    if(options.skipLike !== undefined && options.skipLike.test(trimmedStr)) return str;
    else if(str==="0") return 0;
    else if (options.hex && hexRegex.test(trimmedStr)) {
        return parse_int(trimmedStr, 16);
    // }else if (options.oct && octRegex.test(str)) {
    //     return Number.parseInt(val, 8);
    }else if (trimmedStr.search(/[eE]/)!== -1) { //eNotation
        const notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/); 
        // +00.123 => [ , '+', '00', '.123', ..
        if(notation){
            // console.log(notation)
            if(options.leadingZeros){ //accept with leading zeros
                trimmedStr = (notation[1] || "") + notation[3];
            }else{
                if(notation[2] === "0" && notation[3][0]=== "."){ //valid number
                }else{
                    return str;
                }
            }
            return options.eNotation ? Number(trimmedStr) : str;
        }else{
            return str;
        }
    // }else if (options.parseBin && binRegex.test(str)) {
    //     return Number.parseInt(val, 2);
    }else{
        //separate negative sign, leading zeros, and rest number
        const match = numRegex.exec(trimmedStr);
        // +00.123 => [ , '+', '00', '.123', ..
        if(match){
            const sign = match[1] || "";
            const leadingZeros = match[2];
            let numTrimmedByZeros = trimZeros(match[3]); //complete num without leading zeros
            const decimalAdjacentToLeadingZeros = sign ? // 0., -00., 000.
                str[leadingZeros.length+1] === "." 
                : str[leadingZeros.length] === ".";

            //trim ending zeros for floating number
            if(!options.leadingZeros //leading zeros are not allowed
                && (leadingZeros.length > 1 
                    || (leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros))){
                // 00, 00.3, +03.24, 03, 03.24
                return str;
            }
            else{//no leading zeros or leading zeros are allowed
                const num = Number(trimmedStr);
                const parsedStr = String(num);

                if( num === 0 || num === -0) return num;
                if(parsedStr.search(/[eE]/) !== -1){ //given number is long and parsed to eNotation
                    if(options.eNotation) return num;
                    else return str;
                }else if(trimmedStr.indexOf(".") !== -1){ //floating number
                    if(parsedStr === "0") return num; //0.0
                    else if(parsedStr === numTrimmedByZeros) return num; //0.456. 0.79000
                    else if( parsedStr === `${sign}${numTrimmedByZeros}`) return num;
                    else return str;
                }
                
                let n = leadingZeros? numTrimmedByZeros : trimmedStr;
                if(leadingZeros){
                    // -009 => -9
                    return (n === parsedStr) || (sign+n === parsedStr) ? num : str
                }else  {
                    // +9
                    return (n === parsedStr) || (n === sign+parsedStr) ? num : str
                }
            }
        }else{ //non-numeric string
            return str;
        }
    }
}

/**
 * 
 * @param {string} numStr without leading zeros
 * @returns 
 */
function trimZeros(numStr){
    if(numStr && numStr.indexOf(".") !== -1){//float
        numStr = numStr.replace(/0+$/, ""); //remove ending zeros
        if(numStr === ".")  numStr = "0";
        else if(numStr[0] === ".")  numStr = "0"+numStr;
        else if(numStr[numStr.length-1] === ".")  numStr = numStr.substring(0,numStr.length-1);
        return numStr;
    }
    return numStr;
}

function parse_int(numStr, base){
    //polyfill
    if(parseInt) return parseInt(numStr, base);
    else if(Number.parseInt) return Number.parseInt(numStr, base);
    else if(window && window.parseInt) return window.parseInt(numStr, base);
    else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported")
}