"use client";

import { useMemo, useState } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { VenueMap } from "@/components/venue-map";
import { updateSessionDayAction } from "./actions";

export type SessionDay = {
  id: string;
  day_date: string;
  title: string | null;
  notes: string | null;
  location: string | null;
};

function longDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Day-by-day schedule for a single course seminar. The lead teacher fills in a
 * plan for each day (Edit), or previews a clean programme they can print / copy
 * and hand to their participants (Preview).
 */
export function SessionSchedule({
  sessionId,
  courseName,
  days,
  meta,
  weekLocation = null,
  knownLocations = [],
}: {
  sessionId: string;
  courseName: string;
  days: SessionDay[];
  meta: string;
  weekLocation?: string | null;
  knownLocations?: string[];
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);
  const planned = useMemo(() => days.filter((d) => d.title || d.notes).length, [days]);

  const plainText = useMemo(() => {
    const lines = [`${courseName}`, meta, "", "DAY-BY-DAY PROGRAMME", "--------------------"];
    for (const d of days) {
      lines.push("", `${longDate(d.day_date)}${d.title ? ` — ${d.title}` : ""}`);
      if (d.location) lines.push(`  Meet at: ${d.location}`);
      if (d.notes) for (const ln of d.notes.split("\n")) lines.push(`  ${ln}`);
    }
    return lines.join("\n");
  }, [days, courseName, meta]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the programme:", plainText);
    }
  }

  function printProgramme() {
    const rows = days
      .map(
        (d) => `<tr>
          <td style="padding:12px 16px 12px 0;vertical-align:top;white-space:nowrap;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb">${escapeHtml(
            longDate(d.day_date),
          )}</td>
          <td style="padding:12px 0;vertical-align:top;border-bottom:1px solid #e5e7eb">
            <p style="margin:0;font-weight:600;color:#111827">${escapeHtml(d.title ?? "")}</p>
            ${
              d.location
                ? `<p style="margin:2px 0 0;color:#0369a1;font-size:13px">&#128205; Meet at: ${escapeHtml(d.location)}</p>`
                : ""
            }
            ${
              d.notes
                ? `<p style="margin:4px 0 0;white-space:pre-wrap;color:#374151">${escapeHtml(d.notes)}</p>`
                : `<p style="margin:4px 0 0;color:#9ca3af;font-style:italic">—</p>`
            }
          </td>
        </tr>`,
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
      courseName,
    )}</title></head><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:720px;margin:32px auto;padding:0 24px;color:#111827">
      <h1 style="margin:0;font-size:24px">${escapeHtml(courseName)}</h1>
      <p style="margin:6px 0 24px;color:#6b7280">${escapeHtml(meta)}</p>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
      <p style="margin-top:32px;color:#9ca3af;font-size:12px">Smart Teachers Play More · smartteachersplaymore.com</p>
    </body></html>`;
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["edit", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {m === "edit" ? "Edit schedule" : "Preview / share"}
            </button>
          ))}
        </div>
        {mode === "preview" && (
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={copyText} className="text-xs">
              {copied ? "Copied ✓" : "Copy for participants"}
            </Button>
            <Button type="button" variant="ghost" onClick={printProgramme} className="text-xs">
              Print / PDF
            </Button>
          </div>
        )}
      </div>

      <VenueMap
        days={days.map((d) => ({ id: d.id, day_date: d.day_date, location: d.location }))}
        fallbackLocation={weekLocation}
      />

      {mode === "edit" ? (
        <div className="space-y-3">
          {/* Shared venue suggestions — every location field offers this dropdown
              so a venue is picked once and reused, while still allowing a new
              address to be typed. */}
          <datalist id="known-venues">
            {[...new Set([weekLocation, ...knownLocations].filter((v): v is string => !!v))]
              .sort((a, b) => a.localeCompare(b))
              .map((loc) => (
                <option key={loc} value={loc} />
              ))}
          </datalist>
          {days.map((day) => (
            <div
              key={day.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <form action={updateSessionDayAction} className="space-y-3">
                <input type="hidden" name="day_id" value={day.id} />
                <input type="hidden" name="session_id" value={sessionId} />
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {longDate(day.day_date)}
                </p>
                <Field label="Focus / title" name={`title-${day.id}`}>
                  <Input
                    name="title"
                    defaultValue={day.title ?? ""}
                    placeholder="e.g. Intro & AI foundations, Classroom tools, Field trip"
                  />
                </Field>
                <Field label="Meeting point / location (shows on the venue map)" name={`location-${day.id}`}>
                  <Input
                    name="location"
                    list="known-venues"
                    defaultValue={day.location ?? ""}
                    placeholder={
                      weekLocation
                        ? `Pick a saved venue or type a new address — defaults to ${weekLocation}`
                        : "Pick a saved venue or type a new address"
                    }
                  />
                </Field>
                <Field label="Plan for the day" name={`notes-${day.id}`}>
                  <Textarea
                    name="notes"
                    defaultValue={day.notes ?? ""}
                    rows={3}
                    placeholder="Sessions, timings, activities, materials…"
                  />
                </Field>
                <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">
                  Save day
                </Button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{courseName}</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{meta}</p>
            {planned === 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Nothing scheduled yet — switch to “Edit schedule” to build the programme.
              </p>
            )}
          </div>
          <ol className="relative space-y-6 border-l border-neutral-200 pl-6 dark:border-neutral-800">
            {days.map((d) => (
              <li key={d.id} className="relative">
                <span className="absolute -left-[1.6rem] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-sky-600 ring-4 ring-white dark:ring-neutral-900" />
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  {longDate(d.day_date)}
                </p>
                <p className="mt-0.5 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {d.title || <span className="font-normal italic text-neutral-400">Untitled day</span>}
                </p>
                {d.location && (
                  <p className="mt-0.5 text-sm font-medium text-sky-700 dark:text-sky-400">
                    📍 Meet at: {d.location}
                  </p>
                )}
                {d.notes ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                    {d.notes}
                  </p>
                ) : (
                  <p className="mt-1 text-sm italic text-neutral-400 dark:text-neutral-500">No plan yet.</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
