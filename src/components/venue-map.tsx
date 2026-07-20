"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

export type MapDay = { id: string; day_date: string; location: string | null };

type GeoResult = {
  lat: number;
  lon: number;
  geojson: GeoJSON.Geometry | null;
  displayName: string;
};

function shortDay(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

// Geocode a free-text location to a point + (where OpenStreetMap has it) the
// building footprint, so we can highlight the actual building. Runs in the
// viewer's browser (keyless) and caches each address in localStorage so we
// only ever hit Nominatim once per venue.
async function geocode(query: string): Promise<GeoResult | null> {
  const key = `venue-geo:${query.toLowerCase().trim()}`;
  try {
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached) as GeoResult | null;
  } catch {
    /* localStorage unavailable — just fetch live */
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1&limit=1&q=${encodeURIComponent(
        query,
      )}`,
      { headers: { Accept: "application/json" } },
    );
    const arr = (await res.json()) as Array<{
      lat: string;
      lon: string;
      geojson?: GeoJSON.Geometry;
      display_name: string;
    }>;
    const hit = arr?.[0]
      ? {
          lat: parseFloat(arr[0].lat),
          lon: parseFloat(arr[0].lon),
          geojson: arr[0].geojson ?? null,
          displayName: arr[0].display_name,
        }
      : null;
    try {
      localStorage.setItem(key, JSON.stringify(hit));
    } catch {
      /* ignore quota / private mode */
    }
    return hit;
  } catch {
    return null;
  }
}

/**
 * "Find the venue" map. Groups the schedule days by their meeting point and,
 * for the selected one, draws an OpenStreetMap with the building highlighted
 * in yellow (like a marked-up printout) so participants can see exactly which
 * building to walk into. Falls back to the week's location, and to a marker
 * when OSM has no footprint for the address.
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
  const [status, setStatus] = useState<"idle" | "loading" | "point" | "building" | "notfound">("idle");

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapObj = useRef<LeafletMap | null>(null);
  const overlay = useRef<LayerGroup | null>(null);

  const current = groups[Math.min(selected, Math.max(groups.length - 1, 0))];
  const location = current?.location ?? "";

  useEffect(() => {
    if (!open || !location) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current) return;

      if (!mapObj.current) {
        mapObj.current = L.map(mapEl.current, { scrollWheelZoom: false });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapObj.current);
        mapObj.current.setView([64.13, -21.9], 12);
      }
      mapObj.current.invalidateSize();

      setStatus("loading");
      const geo = await geocode(location);
      if (cancelled || !mapObj.current) return;

      if (overlay.current) {
        overlay.current.remove();
        overlay.current = null;
      }
      if (!geo) {
        setStatus("notfound");
        return;
      }

      const group = L.layerGroup().addTo(mapObj.current);
      overlay.current = group;
      const highlight = { color: "#dc2626", weight: 3, fillColor: "#facc15", fillOpacity: 0.5 };

      if (geo.geojson && (geo.geojson.type === "Polygon" || geo.geojson.type === "MultiPolygon")) {
        const shape = L.geoJSON(geo.geojson, { style: () => highlight }).addTo(group);
        mapObj.current.fitBounds(shape.getBounds(), { padding: [30, 30], maxZoom: 18 });
        setStatus("building");
      } else {
        const latlng: [number, number] = [geo.lat, geo.lon];
        L.circle(latlng, { ...highlight, radius: 35 }).addTo(group);
        L.circleMarker(latlng, {
          radius: 5,
          color: "#dc2626",
          fillColor: "#dc2626",
          fillOpacity: 1,
        }).addTo(group);
        mapObj.current.setView(latlng, 17);
        setStatus("point");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, selected, location]);

  // Tear the map down when the component unmounts.
  useEffect(() => {
    return () => {
      mapObj.current?.remove();
      mapObj.current = null;
    };
  }, []);

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        📍 Add a meeting point to a day below (or set the week&rsquo;s location) and a map will appear
        here with the building highlighted, so everyone can find the venue.
      </div>
    );
  }

  const q = encodeURIComponent(location);

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
            {groups.length === 1 ? location : `${groups.length} meeting points this week`}
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
            <div
              ref={mapEl}
              className="h-72 w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800"
            />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {status === "building" && (
                <span className="inline-flex items-center gap-1.5 font-medium text-neutral-600 dark:text-neutral-300">
                  <span className="inline-block h-3 w-4 rounded-sm border border-red-600 bg-yellow-300" />
                  Building highlighted
                </span>
              )}
              {status === "point" && (
                <span className="text-neutral-500 dark:text-neutral-400">📍 Location marked</span>
              )}
              {status === "loading" && (
                <span className="text-neutral-400">Locating the venue…</span>
              )}
              {status === "notfound" && (
                <span className="text-amber-600 dark:text-amber-400">
                  Couldn&rsquo;t place this address automatically — use the links below.
                </span>
              )}
              {current && current.dates.length > 0 && (
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
