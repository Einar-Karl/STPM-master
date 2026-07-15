// Shared helpers for the course-week planner.

export type Channel = "innie" | "outie";

export const CHANNELS: { value: Channel; label: string; blurb: string }[] = [
  { value: "outie", label: "Outies", blurb: "Foreign teachers coming to STPM courses (smartteachersplaymore.com)" },
  { value: "innie", label: "Innies", blurb: "Icelandic teachers travelling abroad (endurmenntunarferðir.is)" },
];

export function channelLabel(c: Channel): string {
  return c === "innie" ? "Innies" : "Outies";
}

export function paymentBadgeClass(status: string | null): string {
  switch ((status ?? "").toUpperCase()) {
    case "PAID":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    case "PENDING":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    case "OVERDUE":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    case "PARTIAL":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  }
}

// True when a participant's special_needs text actually says something —
// allergy, wheelchair access, diet, etc. Values like "NO", "none", "n/a",
// "-" or "Nei" mean there's nothing to flag.
export function hasSpecialNeeds(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  if (!v) return false;
  return !/^(no|none|n\/?a|nei|nej|nope|nothing|-+|no\.)$/i.test(v);
}

export function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}
