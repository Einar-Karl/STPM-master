"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDateRange } from "@/lib/planner";

export type TimelineBar = {
  id: string;
  start_date: string;
  end_date: string;
  location: string;
  channel: "innie" | "outie";
  courseCount: number;
  staffedCount: number;
  participantCount: number;
};

type Zoom = "year" | "quarter" | "month";
type LocalChannel = "both" | "outie" | "innie";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dayOffset(dateStr: string, year: number): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(year, 0, 1)) / 86_400_000);
}

function monthStartOffset(year: number, month: number): number {
  return Math.round((Date.UTC(year, month, 1) - Date.UTC(year, 0, 1)) / 86_400_000);
}

const CHANNEL_COLOR: Record<TimelineBar["channel"], string> = {
  outie: "bg-sky-600 hover:bg-sky-700",
  innie: "bg-violet-600 hover:bg-violet-700",
};

export function TimelineExplorer({
  year,
  bars,
  initialChannel = "both",
}: {
  year: number;
  bars: TimelineBar[];
  initialChannel?: LocalChannel;
}) {
  const [zoom, setZoom] = useState<Zoom>("year");
  const [channel, setChannel] = useState<LocalChannel>(initialChannel);
  const [anchorMonth, setAnchorMonth] = useState<number>(() => {
    const now = new Date();
    return now.getUTCFullYear() === year ? now.getUTCMonth() : 0;
  });

  const daysInYear = isLeapYear(year) ? 366 : 365;

  const [windowStart, windowEnd, headerTicks] = useMemo(() => {
    if (zoom === "year") {
      const ticks = Array.from({ length: 12 }, (_, m) => ({
        offset: monthStartOffset(year, m),
        label: MONTHS[m],
      }));
      return [0, daysInYear, ticks] as const;
    }
    if (zoom === "quarter") {
      const qStart = Math.floor(anchorMonth / 3) * 3;
      const start = monthStartOffset(year, qStart);
      const end = qStart + 3 >= 12 ? daysInYear : monthStartOffset(year, qStart + 3);
      const ticks = [0, 1, 2].map((i) => ({
        offset: monthStartOffset(year, qStart + i),
        label: MONTHS[qStart + i],
      }));
      return [start, end, ticks] as const;
    }
    const start = monthStartOffset(year, anchorMonth);
    const end = anchorMonth === 11 ? daysInYear : monthStartOffset(year, anchorMonth + 1);
    const ticks = [1, 6, 11, 16, 21, 26].map((d) => ({ offset: start + d - 1, label: String(d) }));
    return [start, end, ticks] as const;
  }, [zoom, anchorMonth, year, daysInYear]);

  const windowSpan = windowEnd - windowStart;

  const visibleBars = useMemo(
    () =>
      bars.filter((b) => {
        if (channel !== "both" && b.channel !== channel) return false;
        const s = dayOffset(b.start_date, year);
        const e = dayOffset(b.end_date, year) + 1;
        return e > windowStart && s < windowEnd;
      }),
    [bars, channel, year, windowStart, windowEnd]
  );

  const lanes = useMemo(
    () => Array.from(new Set(visibleBars.map((b) => b.location))).sort(),
    [visibleBars]
  );

  const now = new Date();
  const nowDay = Math.round(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(year, 0, 1)) / 86_400_000
  );
  const todayOffset =
    now.getUTCFullYear() === year && nowDay >= windowStart && nowDay < windowEnd ? nowDay : null;

  const canPrev = zoom !== "year" && (zoom === "quarter" ? anchorMonth >= 3 : anchorMonth >= 1);
  const canNext =
    zoom !== "year" && (zoom === "quarter" ? anchorMonth <= 8 : anchorMonth <= 10);

  function pan(direction: -1 | 1) {
    const step = zoom === "quarter" ? 3 : 1;
    setAnchorMonth((m) => Math.min(11, Math.max(0, m + direction * step)));
  }

  function jumpToToday() {
    if (now.getUTCFullYear() !== year) return;
    setAnchorMonth(now.getUTCMonth());
    if (zoom === "year") setZoom("month");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["year", "quarter", "month"] as Zoom[]).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                zoom === z
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {z}
            </button>
          ))}
          {zoom !== "year" && (
            <>
              <button
                type="button"
                onClick={() => pan(-1)}
                disabled={!canPrev}
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                &larr;
              </button>
              <button
                type="button"
                onClick={() => pan(1)}
                disabled={!canNext}
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                &rarr;
              </button>
            </>
          )}
          <button
            type="button"
            onClick={jumpToToday}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Today
          </button>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setChannel((c) => (c === "outie" ? "both" : c === "both" ? "innie" : "both"))}
            aria-pressed={channel !== "innie"}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              channel !== "innie"
                ? "bg-sky-600 text-white"
                : "border border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            Outies
          </button>
          <button
            type="button"
            onClick={() => setChannel((c) => (c === "innie" ? "both" : c === "both" ? "outie" : "both"))}
            aria-pressed={channel !== "outie"}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              channel !== "outie"
                ? "bg-violet-600 text-white"
                : "border border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            Innies
          </button>
        </div>
      </div>

      {lanes.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          No course weeks in this view.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="min-w-[880px]">
            <div className="relative flex">
              <div className="w-24 shrink-0 border-r border-b border-neutral-200 dark:border-neutral-800" />
              <div className="relative h-8 flex-1 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                {headerTicks.map((tick, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-neutral-200 pl-1.5 dark:border-neutral-800"
                    style={{ left: `${((tick.offset - windowStart) / windowSpan) * 100}%` }}
                  >
                    <span className="text-xs font-medium leading-8 text-neutral-500 dark:text-neutral-400">
                      {tick.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {lanes.map((location) => (
                <div key={location} className="flex">
                  <div className="flex w-24 shrink-0 items-center border-r border-neutral-200 px-3 py-3 text-sm font-medium text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                    {location}
                  </div>
                  <div className="relative h-14 flex-1">
                    {headerTicks.map((tick, i) => (
                      <div
                        key={i}
                        className="absolute top-0 h-full border-l border-neutral-100 dark:border-neutral-900"
                        style={{ left: `${((tick.offset - windowStart) / windowSpan) * 100}%` }}
                      />
                    ))}
                    {todayOffset !== null && (
                      <div
                        className="absolute top-0 z-10 h-full w-0.5 bg-red-500/70"
                        style={{ left: `${((todayOffset - windowStart) / windowSpan) * 100}%` }}
                      />
                    )}
                    {visibleBars
                      .filter((b) => b.location === location)
                      .map((b) => {
                        const s = Math.max(dayOffset(b.start_date, year), windowStart);
                        const e = Math.min(dayOffset(b.end_date, year) + 1, windowEnd);
                        const left = ((s - windowStart) / windowSpan) * 100;
                        const width = ((e - s) / windowSpan) * 100;
                        const staffingDot =
                          b.courseCount === 0
                            ? "bg-neutral-300"
                            : b.staffedCount === b.courseCount
                              ? "bg-emerald-400"
                              : b.staffedCount > 0
                                ? "bg-amber-400"
                                : "bg-red-400";
                        return (
                          <Link
                            key={b.id}
                            href={`/weeks/${b.id}`}
                            title={`${formatDateRange(b.start_date, b.end_date)} · ${b.location} · ${b.participantCount} registered · ${b.courseCount} courses, ${b.staffedCount} staffed`}
                            className={`absolute top-2 flex h-9 items-center justify-center overflow-hidden rounded px-1.5 text-xs font-semibold text-white shadow-sm ring-2 ring-white transition-colors dark:ring-neutral-950 ${CHANNEL_COLOR[b.channel]}`}
                            style={{ left: `${left}%`, width: `max(${width}%, 26px)` }}
                          >
                            <span className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${staffingDot}`} aria-hidden />
                            <span className="truncate">{b.participantCount}</span>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-600" /> Outies
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-600" /> Innies
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-0.5 bg-red-500/70" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          Staffing: <span className="h-2 w-2 rounded-full bg-emerald-400" /> full
          <span className="h-2 w-2 rounded-full bg-amber-400" /> partial
          <span className="h-2 w-2 rounded-full bg-red-400" /> none
        </span>
        <span>Number in bar = registered participants</span>
      </div>
    </div>
  );
}
