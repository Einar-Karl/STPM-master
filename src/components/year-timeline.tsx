import Link from "next/link";
import { formatDateRange } from "@/lib/planner";

export type TimelineBar = {
  id: string;
  start_date: string;
  end_date: string;
  location: string;
  channel: "innie" | "outie";
  courseCount: number;
  staffedCount: number;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dayOffset(dateStr: string, year: number): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(year, 0, 1)) / 86_400_000);
}

const CHANNEL_COLOR: Record<TimelineBar["channel"], string> = {
  outie: "bg-sky-600 hover:bg-sky-700",
  innie: "bg-violet-600 hover:bg-violet-700",
};

export function YearTimeline({ year, bars }: { year: number; bars: TimelineBar[] }) {
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const monthStarts = Array.from({ length: 12 }, (_, m) =>
    Math.round((Date.UTC(year, m, 1) - Date.UTC(year, 0, 1)) / 86_400_000)
  );

  const lanes = Array.from(new Set(bars.map((b) => b.location))).sort();

  const now = new Date();
  const nowUtcDay = Math.round(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(year, 0, 1)) / 86_400_000
  );
  const todayOffset = now.getUTCFullYear() === year && nowUtcDay >= 0 && nowUtcDay < daysInYear ? nowUtcDay : null;

  if (lanes.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="min-w-[880px]">
        <div className="relative flex">
          <div className="w-24 shrink-0 border-r border-b border-neutral-200 dark:border-neutral-800" />
          <div className="relative h-8 flex-1 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            {monthStarts.map((offset, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-neutral-200 pl-1.5 dark:border-neutral-800"
                style={{ left: `${(offset / daysInYear) * 100}%` }}
              >
                <span className="text-xs font-medium leading-8 text-neutral-500 dark:text-neutral-400">
                  {MONTHS[i]}
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
                {monthStarts.map((offset, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-neutral-100 dark:border-neutral-900"
                    style={{ left: `${(offset / daysInYear) * 100}%` }}
                  />
                ))}
                {todayOffset !== null && (
                  <div
                    className="absolute top-0 z-10 h-full w-0.5 bg-red-500/70"
                    style={{ left: `${(todayOffset / daysInYear) * 100}%` }}
                  />
                )}
                {bars
                  .filter((b) => b.location === location)
                  .map((b) => {
                    const start = dayOffset(b.start_date, year);
                    const end = dayOffset(b.end_date, year) + 1;
                    const left = (start / daysInYear) * 100;
                    const width = ((end - start) / daysInYear) * 100;
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
                        title={`${formatDateRange(b.start_date, b.end_date)} · ${b.location} · ${b.courseCount} courses, ${b.staffedCount} staffed`}
                        className={`absolute top-2 flex h-9 items-center justify-center overflow-hidden rounded px-1.5 text-xs font-semibold text-white shadow-sm ring-2 ring-white transition-colors dark:ring-neutral-950 ${CHANNEL_COLOR[b.channel]}`}
                        style={{ left: `${left}%`, width: `max(${width}%, 26px)` }}
                      >
                        <span
                          className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${staffingDot}`}
                          aria-hidden
                        />
                        <span className="truncate">{b.courseCount}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function YearTimelineLegend() {
  return (
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
      <span>Number in bar = courses that week</span>
    </div>
  );
}
