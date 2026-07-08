export function emptyToNull(value: FormDataEntryValue | null): string | null {
  const str = typeof value === "string" ? value.trim() : "";
  return str.length > 0 ? str : null;
}

export function requiredString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalNumber(value: FormDataEntryValue | null): number | null {
  const str = typeof value === "string" ? value.trim() : "";
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}
