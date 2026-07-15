// Reading participant sign-ups from a linked Google Sheet.
//
// A Google Sheet that is shared "Anyone with the link → Viewer" (or published to
// the web) can be read as CSV with no API key via its export endpoint. We turn a
// normal sheet link into that CSV URL, fetch it server-side, parse it, and map
// the columns onto our booking fields by matching the header names.

/** Turn any Google Sheets link into a no-auth CSV export URL, or null if it isn't one. */
export function toCsvExportUrl(url: string): string | null {
  const trimmed = url.trim();
  // Already a "Publish to web" CSV link.
  if (/output=csv/.test(trimmed)) return trimmed;
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([A-Za-z0-9-_]+)/);
  if (!idMatch) return null;
  const id = idMatch[1];
  const gidMatch = trimmed.match(/[#&?]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

/** RFC-4180-ish CSV parser: handles quoted fields, escaped quotes, commas and newlines inside quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // drop fully-empty rows
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export type BookingField =
  | "participant_name"
  | "first_name"
  | "participant_email"
  | "nationality"
  | "school"
  | "coordinator"
  | "phone"
  | "tour_booked";

// Header keywords per field (English + a little Icelandic), matched case-insensitively.
// Exact matches win over "contains" matches, and each column is used only once.
const FIELD_KEYWORDS: { field: BookingField; exact: string[]; contains: string[] }[] = [
  { field: "participant_name", exact: ["name", "full name", "participant name", "nafn", "participant", "attendee"], contains: ["full name", "participant", "attendee name"] },
  { field: "participant_email", exact: ["email", "e-mail", "netfang", "mail"], contains: ["email", "e-mail", "netfang"] },
  { field: "nationality", exact: ["nationality", "country", "þjóðerni"], contains: ["nationality", "country"] },
  { field: "school", exact: ["school", "skóli", "institution", "organisation", "organization"], contains: ["school", "institution", "organis", "organiz"] },
  { field: "coordinator", exact: ["coordinator", "contact person", "contact", "tengiliður"], contains: ["coordinator", "contact"] },
  { field: "phone", exact: ["phone", "telephone", "mobile", "sími", "simi"], contains: ["phone", "mobile", "sími"] },
  { field: "tour_booked", exact: ["tour", "excursion", "golden circle", "ferð", "ferd"], contains: ["tour", "excursion"] },
];

const norm = (s: string) => s.trim().toLowerCase();

/** Map header columns → booking fields. Returns { field: columnIndex }. */
export function detectMapping(headers: string[]): Partial<Record<BookingField, number>> {
  const normalized = headers.map(norm);
  const used = new Set<number>();
  const mapping: Partial<Record<BookingField, number>> = {};

  // exact matches first (higher confidence), then contains
  for (const pass of ["exact", "contains"] as const) {
    for (const { field, exact, contains } of FIELD_KEYWORDS) {
      if (mapping[field] !== undefined) continue;
      const keys = pass === "exact" ? exact : contains;
      const idx = normalized.findIndex(
        (h, i) => !used.has(i) && keys.some((k) => (pass === "exact" ? h === k : h.includes(k))),
      );
      if (idx >= 0) {
        mapping[field] = idx;
        used.add(idx);
      }
    }
  }
  return mapping;
}

const YES = new Set(["yes", "y", "true", "1", "x", "já", "ja", "booked", "tour"]);
const NO = new Set(["no", "n", "false", "0", "nei", "none", "-"]);

/** Interpret a free-text tour cell as true / false / unknown(null). */
export function parseTour(value: string | undefined): boolean | null {
  if (value === undefined) return null;
  const v = norm(value);
  if (v === "") return null;
  if (YES.has(v)) return true;
  if (NO.has(v)) return false;
  // any other non-empty text (e.g. "Golden Circle") counts as booked
  return true;
}

export type MappedRow = {
  participant_name: string;
  first_name: string | null;
  participant_email: string | null;
  nationality: string | null;
  school: string | null;
  coordinator: string | null;
  phone: string | null;
  tour_booked: boolean | null;
};

const cell = (row: string[], idx: number | undefined) =>
  idx === undefined ? "" : (row[idx] ?? "").trim();

/** Map data rows to booking-shaped objects. Rows with no name are dropped. */
export function mapRows(
  headers: string[],
  rows: string[][],
  mapping: Partial<Record<BookingField, number>>,
): MappedRow[] {
  const out: MappedRow[] = [];
  for (const row of rows) {
    const name = cell(row, mapping.participant_name);
    if (!name) continue;
    out.push({
      participant_name: name,
      first_name: name.split(/\s+/)[0] || null,
      participant_email: cell(row, mapping.participant_email) || null,
      nationality: cell(row, mapping.nationality) || null,
      school: cell(row, mapping.school) || null,
      coordinator: cell(row, mapping.coordinator) || null,
      phone: cell(row, mapping.phone) || null,
      tour_booked: mapping.tour_booked === undefined ? null : parseTour(row[mapping.tour_booked]),
    });
  }
  return out;
}

export const MAPPING_LABELS: Record<BookingField, string> = {
  participant_name: "Name",
  first_name: "First name",
  participant_email: "Email",
  nationality: "Nationality",
  school: "School",
  coordinator: "Coordinator",
  phone: "Phone",
  tour_booked: "Tour",
};
