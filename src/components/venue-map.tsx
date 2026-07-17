"use client";

import { useMemo, useState } from "react";

export type MapDay = { id: string; day_date: string; location: string | null };

function shortDay(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * "Find the venue" map. Groups the schedule days by their meeting point and
 * shows the selected one on an embedded Google Map (keyless embed), with
 * open-in-maps and directions links. Days without their own location fall
 * back to the week's location.
 */
export function VenueMap({ days, fallbackLocation }: { days: MapDay[]; fallbackLocation: string | null }) {
  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of days) {
      const loc = d.location?.trim() || fallbackLocation?.trim();
      if (!loc) continue;
      const list = map.get(loc) ?? [];
      list.push(d.day_date);
      map.set(loc, list);
    }
    if (map.size === 0 && fallbackLocation?.trim()) map.set(fallbackLocation.trim(), []);
    return [...map.entries()].map(([location, dates]) => ({ location, dates }));
  }, [days, fallbackLocation]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        📍 Add a meeting point to a day below (or set the week&rsquo;s location) and a map will appear
        here to help everyone find the venue.
      </div>
    );
  }

  const current = groups[Math.min(selected, groups.length - 1)];
  const q = encodeURIComponent(current.location);

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          📍 Find the venue
          <span className="ml-2 font-normal text-neutral-500 dark:text-neutral-400">
            {groups.length === 1
              ? current.location
              : `${groups.length} meeting points this week`}
          </span>
        </span>
        <span className="text-xs text-neutral-400">{open ? "Hide map ▲" : "Show map ▼"}</span>
      </button>

      {open && (
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          {groups.length > 1 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3">
              {groups.map((g, i) => (
                <button
                  key={g.location}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    i === selected
                      ? "bg-sky-600 text-white"
                      : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  {g.location}
                </button>
              ))}
            </div>
          )}

          <div className="p-4">
            <iframe
              key={current.location}
              title={`Map of ${current.location}`}
              src={`https://maps.google.com/maps?q=${q}&z=15&output=embed`}
              className="h-72 w-full rounded-lg border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {current.dates.length > 0 && (
                <span className="text-neutral-500 dark:text-neutral-400">
                  {current.dates.map(shortDay).join(" · ")}
                </span>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-sky-600 hover:underline dark:text-sky-400"
              >
                Open in Google Maps ↗
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${q}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-sky-600 hover:underline dark:text-sky-400"
              >
                Get directions ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
