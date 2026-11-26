const oneDecimal = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export function roundForDisplay(value: number | null) {
  if (value === null) return null;
  const rounded =
    Math.sign(value) *
    (Math.round((Math.abs(value) + Number.EPSILON) * 10) / 10);
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function displayedDifference(a: number | null, b: number | null) {
  const roundedA = roundForDisplay(a);
  const roundedB = roundForDisplay(b);
  if (roundedA === null || roundedB === null) return null;
  return roundForDisplay(roundedB - roundedA);
}

export function formatDistance(value: number | null) {
  const rounded = roundForDisplay(value);
  return rounded === null ? "—" : `${oneDecimal.format(rounded)} m`;
}

export function formatPercent(value: number | null) {
  const rounded = roundForDisplay(value);
  return rounded === null ? "—" : `${oneDecimal.format(rounded)}%`;
}

export function formatSignedDifference(
  value: number | null,
  unit: "m" | "pp" | "",
) {
  const rounded = roundForDisplay(value);
  if (rounded === null) return "—";
  const sign = rounded > 0 ? "+" : "";
  const formatted = oneDecimal.format(rounded);
  return `${sign}${formatted}${unit ? ` ${unit}` : ""}`;
}
