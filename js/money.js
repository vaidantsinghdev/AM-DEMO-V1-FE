// Money helpers — work in integer cents, format on display.

export function parseMoney(input) {
  if (input === null || input === undefined || input === "") return 0;
  const s = String(input).replace(/[$,\s]/g, "").trim();
  if (s === "") return 0;
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

export function formatMoney(cents) {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return "$0.00";
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  return sign + "$" + dollars.toLocaleString("en-US") + "." + fraction;
}

export const centsToFloat = (c) => Math.round(c) / 100;
export const floatToCents = (n) => Math.round(Number(n || 0) * 100);
