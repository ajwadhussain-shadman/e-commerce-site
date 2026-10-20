/**
 * Server-side BDT helpers. Keep monetary arithmetic in integer paisa so a
 * fractional price cannot accumulate floating-point noise in an order total.
 */

function normalizeMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

function toMinorUnits(value) {
  const normalized = normalizeMoney(value);
  return normalized === null ? null : Math.round(normalized * 100);
}

function fromMinorUnits(minorUnits) {
  const number = Number(minorUnits);
  return Number.isFinite(number) ? number / 100 : 0;
}

function formatBDT(value) {
  const amount = normalizeMoney(value);
  if (amount === null) return "৳0";
  const absolute = Math.abs(amount);
  return `${amount < 0 ? "-" : ""}৳${absolute.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

module.exports = { normalizeMoney, toMinorUnits, fromMinorUnits, formatBDT };
