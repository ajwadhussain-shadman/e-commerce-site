/**
 * Shared BDT money helpers.
 *
 * Product prices are stored as BDT amounts with at most two decimal places.
 * Whole-taka amounts are displayed without a trailing `.00`, while fractional
 * amounts keep at most two decimal places. All server-side arithmetic is done
 * in integer paisa (1 taka = 100 paisa) so floating-point noise cannot add a
 * stray 0.01 to an order total.
 */

const AMOUNT_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  useGrouping: true,
});

/** Round a monetary value to two decimal places, or return null if invalid. */
export function normalizeMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

/** Convert taka to integer paisa. */
export function toMinorUnits(value) {
  const normalized = normalizeMoney(value);
  return normalized === null ? null : Math.round(normalized * 100);
}

/** Convert integer paisa to taka. */
export function fromMinorUnits(minorUnits) {
  const number = Number(minorUnits);
  return Number.isFinite(number) ? number / 100 : 0;
}

/**
 * Format a BDT amount for display.
 * 549 -> "৳549", 549.5 -> "৳549.5", 549.01 -> "৳549.01"
 */
export function formatBDT(value) {
  const amount = normalizeMoney(value);
  if (amount === null) return "৳0";
  const absolute = Math.abs(amount);
  return `${amount < 0 ? "-" : ""}৳${AMOUNT_FORMATTER.format(absolute)}`;
}
