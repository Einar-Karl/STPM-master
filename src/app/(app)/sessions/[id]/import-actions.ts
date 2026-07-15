"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  detectMapping,
  mapRows,
  parseCsv,
  toCsvExportUrl,
  type MappedRow,
} from "@/lib/sheet-import";

export type SheetPreview =
  | { ok: true; headers: string[]; mappedHeaders: string[]; rows: MappedRow[] }
  | { ok: false; error: string };

/** Fetch a linked Google Sheet as CSV and return a mapped preview of its rows. */
export async function previewSheetAction(rawUrl: string): Promise<SheetPreview> {
  await requireStaff();

  const csvUrl = toCsvExportUrl(rawUrl ?? "");
  if (!csvUrl) {
    return { ok: false, error: "That doesn't look like a Google Sheets link. Paste the sheet's URL." };
  }

  let res: Response;
  try {
    res = await fetch(csvUrl, { redirect: "follow", headers: { accept: "text/csv,*/*" } });
  } catch {
    return { ok: false, error: "Couldn't reach the sheet. Check the link and try again." };
  }

  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      error: "The sheet is private. In Google Sheets: Share → General access → “Anyone with the link → Viewer”.",
    };
  }
  if (!res.ok) {
    return { ok: false, error: `The sheet returned an error (${res.status}). Check the link and sharing settings.` };
  }

  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    return {
      ok: false,
      error: "Got a sign-in page instead of data. Set the sheet to “Anyone with the link → Viewer”, then try again.",
    };
  }

  const table = parseCsv(text);
  if (table.length < 2) {
    return { ok: false, error: "The sheet has a header but no participant rows yet." };
  }

  const headers = table[0];
  const mapping = detectMapping(headers);
  if (mapping.participant_name === undefined) {
    return {
      ok: false,
      error: "Couldn't find a name column. Make sure one column header is “Name” (or similar).",
    };
  }

  const rows = mapRows(headers, table.slice(1), mapping);
  const mappedHeaders = Object.entries(mapping)
    .sort((a, b) => (a[1] as number) - (b[1] as number))
    .map(([, idx]) => headers[idx as number]);

  return { ok: true, headers, mappedHeaders, rows };
}

/** Insert the previewed rows as bookings on a session, skipping names already on the roster. */
export async function importSheetRowsAction(
  sessionId: string,
  rows: MappedRow[],
): Promise<{ inserted: number; skipped: number }> {
  await requireStaff();
  if (!sessionId || !rows?.length) return { inserted: 0, skipped: 0 };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("course_bookings")
    .select("participant_name")
    .eq("session_id", sessionId);
  const seen = new Set((existing ?? []).map((b) => b.participant_name.trim().toLowerCase()));

  const toInsert = rows
    .filter((r) => r.participant_name && !seen.has(r.participant_name.trim().toLowerCase()))
    .map((r) => ({
      session_id: sessionId,
      participant_name: r.participant_name,
      first_name: r.first_name,
      participant_email: r.participant_email,
      nationality: r.nationality,
      school: r.school,
      coordinator: r.coordinator,
      phone: r.phone,
      tour_booked: r.tour_booked,
      status: "confirmed" as const,
    }));

  if (toInsert.length) {
    await supabase.from("course_bookings").insert(toInsert);
  }

  revalidatePath(`/sessions/${sessionId}`);
  return { inserted: toInsert.length, skipped: rows.length - toInsert.length };
}
