import { normalizeMoney, toMinorUnits, fromMinorUnits } from "./src/lib/currency.mjs";

console.log("normalizeMoney(549):", normalizeMoney(549));
console.log("normalizeMoney(549.009):", normalizeMoney(549.009));
console.log("toMinorUnits(549):", toMinorUnits(549));
console.log("toMinorUnits(549.01):", toMinorUnits(549.01));
console.log("fromMinorUnits(54900):", fromMinorUnits(54900));
console.log("fromMinorUnits(54901):", fromMinorUnits(54901));