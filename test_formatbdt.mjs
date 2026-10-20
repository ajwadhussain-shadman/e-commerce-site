const AMOUNT_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  useGrouping: true,
});

console.log("AMOUNT_FORMATTER.format(549):", AMOUNT_FORMATTER.format(549));
console.log("AMOUNT_FORMATTER.format(549.01):", AMOUNT_FORMATTER.format(549.01));
console.log("AMOUNT_FORMATTER.format(549.5):", AMOUNT_FORMATTER.format(549.5));
console.log("AMOUNT_FORMATTER.format(549.1):", AMOUNT_FORMATTER.format(549.1));

// Also test with the full formatBDT function
const { normalizeMoney } = await import("./src/lib/currency.mjs");
function formatBDT(value) {
  const amount = normalizeMoney(value);
  if (amount === null) return "৳0";
  const absolute = Math.abs(amount);
  return `${amount < 0 ? "-" : ""}৳${AMOUNT_FORMATTER.format(absolute)}`;
}

console.log("formatBDT(549):", formatBDT(549));
console.log("formatBDT(549.01):", formatBDT(549.01));
console.log("formatBDT(549.5):", formatBDT(549.5));
console.log("formatBDT(549.1):", formatBDT(549.1));