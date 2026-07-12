"use client";

import { useMemo, useState } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { channelLabel, formatDateRange, type Channel } from "@/lib/planner";

export type ItineraryDay = {
  id: string;
  day_date: string;
  title: string | null;
  notes: string | null;
};

export type ItineraryCourse = {
  name: string;
  lead: string | null;
  support: string | null;
  count: number;
};

type WeekInfo = {
  id: string;
  start_date: string;
  end_date: string;
  location: string;
  channel: Channel;
};

function longDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function shortDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Day-by-day planner for a course week. Two modes:
 *  - "edit": one form per day (title + plan/notes), saved via a server action.
 *  - "share": a clean, presentation-quality itinerary that can be copied into
 *    an email or printed / saved as PDF and sent to participants.
 */
export function WeekItinerary({
  week,
  days,
  courses,
  updateDayPlanAction,
}: {
  week: WeekInfo;
  days: ItineraryDay[];
  courses: ItineraryCourse[];
  updateDayPlanAction: (formData: FormData) => void | Promise<void>;
}) {
  const [mode, setMode] = useState<"edit" | "share">("share");
  const [copied, setCopied] = useState(false);

  const planned = useMemo(() => days.filter((d) => d.title || d.notes), [days]);
  const totalParticipants = useMemo(
    () => courses.reduce((sum, c) => sum + c.count, 0),
    [courses]
  );

  const plainText = useMemo(() => {
    const lines: string[] = [];
    lines.push(`${week.location} — ${formatDateRange(week.start_date, week.end_date)}`);
    lines.push(`${channelLabel(week.channel)} · ${courses.length} courses · ${totalParticipants} participants`);
    lines.push("");
    lines.push("PROGRAMME — DAY BY DAY");
    lines.push("----------------------");
    for (const d of days) {
      lines.push("");
      lines.push(`${longDate(d.day_date)}${d.title ? ` — ${d.title}` : ""}`);
      if (d.notes) {
        for (const ln of d.notes.split("\n")) lines.push(`  ${ln}`);
      }
    }
    if (courses.length) {
      lines.push("");
      lines.push("COURSES RUNNING THIS WEEK");
      lines.push("-------------------------");
      for (const c of courses) {
        const staff = [c.lead, c.support].filter(Boolean).join(" & ");
        lines.push(`• ${c.name}${staff ? ` (${staff})` : ""}`);
      }
    }
    return lines.join("\n");
  }, [week, days, courses, totalParticipants]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — fall back to a selectable prompt.
      window.prompt("Copy the itinerary text:", plainText);
    }
  }

  function printItinerary() {
    const rows = days
      .map((d) => {
        const notes = d.notes
          ? `<p style="margin:4px 0 0;white-space:pre-wrap;color:#374151">${escapeHtml(d.notes)}</p>`
          : `<p style="margin:4px 0 0;color:#9ca3af;font-style:italic">No plan yet.</p>`;
        return `<tr>
          <td style="padding:12px 16px 12px 0;vertical-align:top;white-space:nowrap;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb">${escapeHtml(
            shortDate(d.day_date)
          )}</td>
          <td style="padding:12px 0;vertical-align:top;border-bottom:1px solid #e5e7eb">
            <p style="margin:0;font-weight:600;color:#111827">${escapeHtml(d.title ?? "")}</p>
            ${notes}
          </td>
        </tr>`;
      })
      .join("");
    const courseRows = courses
      .map((c) => {
        const staff = [c.lead, c.support].filter(Boolean).join(" & ");
        return `<li style="margin:2px 0">${escapeHtml(c.name)}${
          staff ? ` <span style="color:#6b7280">— ${escapeHtml(staff)}</span>` : ""
        }</li>`;
      })
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
      week.location
    )} itinerary</title></head>
    <body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:720px;margin:32px auto;padding:0 24px;color:#111827">
      <h1 style="margin:0;font-size:26px">${escapeHtml(week.location)} · ${escapeHtml(
        formatDateRange(week.start_date, week.end_date)
      )}</h1>
      <p style="margin:6px 0 24px;color:#6b7280">${escapeHtml(
        channelLabel(week.channel)
      )} · ${courses.length} courses · ${totalParticipants} participants</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px">${rows}</table>
      ${
        courses.length
          ? `<h2 style="font-size:16px;margin:0 0 8px">Courses running this week</h2>
             <ul style="margin:0;padding-left:20px;color:#111827">${courseRows}</ul>`
          : ""
      }
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
          {(["share", "edit"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                mode === m
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {m === "share" ? "Preview / share" : "Edit plan"}
            </button>
          ))}
        </div>
        {mode === "share" && (
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={copyText} className="text-xs">
              {copied ? "Copied ✓" : "Copy for email"}
            </Button>
            <Button type="button" variant="ghost" onClick={printItinerary} className="text-xs">
              Print / PDF
            </Button>
          </div>
        )}
      </div>

      {mode === "share" ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {week.location} · {formatDateRange(week.start_date, week.end_date)}
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {channelLabel(week.channel)} · {courses.length} courses · {totalParticipants} participants
            </p>
            {planned.length === 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                No days filled in yet — switch to “Edit plan” to add the programme.
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

          {courses.length > 0 && (
            <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Courses running this week
              </h3>
              <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                {courses.map((c) => {
                  const staff = [c.lead, c.support].filter(Boolean).join(" & ");
                  return (
                    <li key={c.name} className="flex flex-wrap gap-x-2">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{c.name}</span>
                      {staff && <span className="text-neutral-400">— {staff}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day) => (
            <div
              key={day.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <form action={updateDayPlanAction} className="space-y-3">
                <input type="hidden" name="day_id" value={day.id} />
                <input type="hidden" name="week_id" value={week.id} />
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {longDate(day.day_date)}
                </p>
                <Field label="Title" name={`title-${day.id}`}>
                  <Input
                    name="title"
                    defaultValue={day.title ?? ""}
                    placeholder="e.g. Arrival day, Golden Circle tour, Course day 3"
                  />
                </Field>
                <Field label="Plan / notes" name={`notes-${day.id}`}>
                  <Textarea name="notes" defaultValue={day.notes ?? ""} rows={2} />
                </Field>
                <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">
                  Save
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
