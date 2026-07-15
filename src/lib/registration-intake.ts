// Normalising an inbound online-registration payload (from Kajabi, directly or
// via Zapier/Make) into our booking fields. Kajabi/Zapier let you send arbitrary
// JSON, so we match keys loosely by name — the same idea as the sign-up-sheet
// column matcher, but for JSON object keys, and tolerant of nested objects.

import { parseTour } from "./sheet-import";

/** Flatten a nested payload to leaf values keyed by their (last) key name. */
export function flattenPayload(input: unknown, out: Record<string, string> = {}): Record<string, string> {
  if (!input || typeof input !== "object") return out;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") {
      flattenPayload(value, out);
    } else {
      // last write wins; keep the first non-empty though
      const s = String(value);
      if (out[key] === undefined || out[key] === "") out[key] = s;
    }
  }
  return out;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[\s_-]+/g, "");

// `exact` matches the whole (normalised) key; `contains` matches as a substring.
// Keep bare, collision-prone words like "name" out of `contains` so they don't
// swallow "first_name"/"last_name".
type FieldSpec = { exact: string[]; contains: string[] };
const FIELDS: Record<string, FieldSpec> = {
  participant_name: { exact: ["name", "fullname", "participantname", "attendee", "attendeename", "nafn"], contains: ["fullname", "participantname", "attendeename"] },
  first_name: { exact: ["firstname", "givenname", "fornafn"], contains: ["firstname", "givenname"] },
  last_name: { exact: ["lastname", "surname", "familyname", "eftirnafn"], contains: ["lastname", "surname"] },
  participant_email: { exact: ["email", "emailaddress", "netfang", "mail"], contains: ["email", "netfang"] },
  nationality: { exact: ["nationality", "country", "þjóðerni", "thjoderni"], contains: ["nationality", "country"] },
  school: { exact: ["school", "skóli", "skoli", "institution", "organisation", "organization"], contains: ["school", "institution", "organis", "organiz"] },
  coordinator: { exact: ["coordinator", "contactperson", "contact", "tengiliður", "tengilidur"], contains: ["coordinator", "contact"] },
  phone: { exact: ["phone", "telephone", "mobile", "sími", "simi"], contains: ["phone", "mobile"] },
  tour_booked: { exact: ["tour", "excursion", "goldencircle", "ferð", "ferd"], contains: ["tour", "excursion"] },
  registration_key: { exact: ["registrationkey", "coursekey", "course", "offer", "offername", "product", "productname", "coursecode"], contains: ["registrationkey", "coursekey", "coursecode", "offername", "productname"] },
  session_id: { exact: ["sessionid", "session"], contains: ["sessionid"] },
};

function pick(flat: Record<string, string>, spec: FieldSpec): string | undefined {
  const entries = Object.entries(flat).map(([k, v]) => [norm(k), v] as const);
  for (const key of spec.exact) {
    const hit = entries.find(([k]) => k === key);
    if (hit && hit[1].trim() !== "") return hit[1].trim();
  }
  for (const key of spec.contains) {
    const hit = entries.find(([k]) => k.includes(key));
    if (hit && hit[1].trim() !== "") return hit[1].trim();
  }
  return undefined;
}

export type NormalizedRegistration = {
  participant_name: string | null;
  first_name: string | null;
  participant_email: string | null;
  nationality: string | null;
  school: string | null;
  coordinator: string | null;
  phone: string | null;
  tour_booked: boolean | null;
  registration_key: string | null;
  session_id: string | null;
};

export function normalizeRegistration(payload: unknown): NormalizedRegistration {
  const flat = flattenPayload(payload);

  let name = pick(flat, FIELDS.participant_name) ?? null;
  const first = pick(flat, FIELDS.first_name) ?? null;
  const last = pick(flat, FIELDS.last_name) ?? null;
  if (!name && (first || last)) name = [first, last].filter(Boolean).join(" ");

  const email = pick(flat, FIELDS.participant_email) ?? null;

  return {
    participant_name: name,
    first_name: first ?? (name ? name.split(/\s+/)[0] : null),
    participant_email: email,
    nationality: pick(flat, FIELDS.nationality) ?? null,
    school: pick(flat, FIELDS.school) ?? null,
    coordinator: pick(flat, FIELDS.coordinator) ?? null,
    phone: pick(flat, FIELDS.phone) ?? null,
    tour_booked: parseTour(pick(flat, FIELDS.tour_booked)),
    registration_key: pick(flat, FIELDS.registration_key) ?? null,
    session_id: pick(flat, FIELDS.session_id) ?? null,
  };
}
