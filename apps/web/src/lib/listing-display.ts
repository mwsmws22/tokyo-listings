export function formatRentYen(value: number): string {
  const manYen = value / 10_000;
  const rendered = Number.isInteger(manYen) ? manYen.toFixed(0) : manYen.toFixed(1);
  return `${rendered}万円`;
}

export function formatAreaSqm(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "N/A";
  }
  return `${numeric.toFixed(1)} ㎡`;
}

export function formatMonthsJa(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "N/A";
  }
  const trimmed = Number.parseFloat(numeric.toFixed(2)).toString();
  return `${trimmed}ヶ月`;
}
