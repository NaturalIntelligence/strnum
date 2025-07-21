import { Bench } from 'tinybench'
import toNumber from "./strnum.js"

const bench = new Bench({ name: 'strnum benchmark', time: 100 })

function toNumberBenchmark(str, options) {
	bench.add(`${str}${options ? ', ' + JSON.stringify(options) : ''}`, () => {
		toNumber(str, options)
	})
}

toNumberBenchmark(undefined);
toNumberBenchmark(null);
toNumberBenchmark("");
toNumberBenchmark("string");
toNumberBenchmark("e89794659669cb7bb967db73a7ea6889c3891727")
toNumberBenchmark("12,12");
toNumberBenchmark("12 12");
toNumberBenchmark("12-12");
toNumberBenchmark("12.12.12");
toNumberBenchmark("+12");
toNumberBenchmark("+ 12");
toNumberBenchmark("12+12");
toNumberBenchmark("1212+");
toNumberBenchmark("0x2f");
toNumberBenchmark("-0x2f");
toNumberBenchmark("0x2f", { hex: true });
toNumberBenchmark("-0x2f", { hex: true });
toNumberBenchmark("0x2f", { hex: false });
toNumberBenchmark("-0x2f", { hex: false });
toNumberBenchmark("0xzz");
toNumberBenchmark("iweraf0x123qwerqwer");
toNumberBenchmark("1230x55");
toNumberBenchmark("JVBERi0xLjMNCiXi48");
toNumberBenchmark("0");
toNumberBenchmark("00");
toNumberBenchmark("00.0");

toNumberBenchmark("0", { leadingZeros: false });
toNumberBenchmark("00", { leadingZeros: false });
toNumberBenchmark("00.0", { leadingZeros: false });

toNumberBenchmark("06");
toNumberBenchmark("06", { leadingZeros: true });
toNumberBenchmark("06", { leadingZeros: false });

toNumberBenchmark("006");
toNumberBenchmark("006", { leadingZeros: true });
toNumberBenchmark("006", { leadingZeros: false });

toNumberBenchmark("000000000000000000000000017717", { leadingZeros: false });
toNumberBenchmark("000000000000000000000000017717", { leadingZeros: true });
toNumberBenchmark("0420926189200190257681175017717");
toNumberBenchmark("20.21.030");
toNumberBenchmark("0.21.030");
toNumberBenchmark("0.21.");
toNumberBenchmark("0.");
toNumberBenchmark("+0.");
toNumberBenchmark("-0.");
toNumberBenchmark("1.");
toNumberBenchmark("00.00");
toNumberBenchmark("0.06");
toNumberBenchmark("00.6");
toNumberBenchmark(".006");
toNumberBenchmark("6.0");
toNumberBenchmark("06.0");

toNumberBenchmark("0.0", { leadingZeros: false });
toNumberBenchmark("00.00", { leadingZeros: false });
toNumberBenchmark("0.06", { leadingZeros: false });
toNumberBenchmark("00.6", { leadingZeros: false });
toNumberBenchmark(".006", { leadingZeros: false });
toNumberBenchmark("6.0", { leadingZeros: false });
toNumberBenchmark("06.0", { leadingZeros: false });
toNumberBenchmark("+06");
toNumberBenchmark("-06");
toNumberBenchmark("-06", { leadingZeros: true });
toNumberBenchmark("-06", { leadingZeros: false });

toNumberBenchmark("-0.0");
toNumberBenchmark("-00.00");
toNumberBenchmark("-0.06");
toNumberBenchmark("-00.6");
toNumberBenchmark("-.006");
toNumberBenchmark("-6.0");
toNumberBenchmark("-06.0");
toNumberBenchmark("+06.0");

toNumberBenchmark("-0.0", { leadingZeros: false });
toNumberBenchmark("-00.00", { leadingZeros: false });
toNumberBenchmark("-0.06", { leadingZeros: false });
toNumberBenchmark("-00.6", { leadingZeros: false });
toNumberBenchmark("-.006", { leadingZeros: false });
toNumberBenchmark("-6.0", { leadingZeros: false });
toNumberBenchmark("-06.0", { leadingZeros: false });
toNumberBenchmark("020211201030005811824");
toNumberBenchmark("20211201030005811824");
toNumberBenchmark("20.211201030005811824");
toNumberBenchmark("0.211201030005811824");
toNumberBenchmark("01.0e2", { leadingZeros: false });
toNumberBenchmark("-01.0e2", { leadingZeros: false });
toNumberBenchmark("01.0e2");
toNumberBenchmark("-01.0e2");
toNumberBenchmark("1.0e2");

toNumberBenchmark("-1.0e2");
toNumberBenchmark("1.0e-2");

toNumberBenchmark("420926189200190257681175017717");
toNumberBenchmark("420926189200190257681175017717", { eNotation: false });

toNumberBenchmark("1e-2");
toNumberBenchmark("1e+2");
toNumberBenchmark("1.e+2");
toNumberBenchmark("01.0E2", { leadingZeros: false });
toNumberBenchmark("-01.0E2", { leadingZeros: false });
toNumberBenchmark("01.0E2");
toNumberBenchmark("-01.0E2");
toNumberBenchmark("1.0E2");

toNumberBenchmark("-1.0E2");
toNumberBenchmark("1.0E-2");

toNumberBenchmark("E-2");
toNumberBenchmark("E2");
toNumberBenchmark("0E2");
toNumberBenchmark("-0E2");
toNumberBenchmark("00E2");
toNumberBenchmark("00E2", { leadingZeros: false });
toNumberBenchmark("0", { skipLike: /.*/ });
toNumberBenchmark("+12", { skipLike: /\+[0-9]{10}/ });
toNumberBenchmark("12+12", { skipLike: /\+[0-9]{10}/ });
toNumberBenchmark("12+1212121212", { skipLike: /\+[0-9]{10}/ });
toNumberBenchmark("+1212121212");
toNumberBenchmark("+1212121212", { skipLike: /\+[0-9]{10}/ });
toNumberBenchmark("+12 12");
toNumberBenchmark("    +12 12   ");
toNumberBenchmark("   +1212   ");
toNumberBenchmark("+1212");
toNumberBenchmark("+12.12");
toNumberBenchmark("-12.12");
toNumberBenchmark("-012.12");

toNumberBenchmark("Infinity");
toNumberBenchmark("-Infinity");
toNumberBenchmark("+Infinity");
toNumberBenchmark("Infinity", { infinity: true });
toNumberBenchmark("-Infinity", { infinity: true });
toNumberBenchmark("+Infinity", { infinity: true });
toNumberBenchmark("Infinity", { infinity: false });
toNumberBenchmark("-Infinity", { infinity: false });
toNumberBenchmark("+Infinity", { infinity: false });
toNumberBenchmark("  Infinity  ");
toNumberBenchmark("  -Infinity  ");
toNumberBenchmark("  +Infinity  ");

await bench.run()

console.log(bench.name)
console.table(bench.table())