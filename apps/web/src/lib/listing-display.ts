export function formatRentYen(value: number): string {
  return `${value.toLocaleString()} JPY`;
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
