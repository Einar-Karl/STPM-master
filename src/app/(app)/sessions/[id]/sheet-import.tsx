"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Card, Input } from "@/components/ui";
import type { MappedRow } from "@/lib/sheet-import";
import { importSheetRowsAction, previewSheetAction, type SheetPreview } from "./import-actions";

export function SheetImport({
  sessionId,
  defaultUrl,
}: {
  sessionId: string;
  defaultUrl: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [preview, setPreview] = useState<SheetPreview | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [pending, start] = useTransition();

  function fetchPreview() {
    setResult(null);
    start(async () => setPreview(await previewSheetAction(url)));
  }

  function runImport(rows: MappedRow[]) {
    start(async () => {
      const r = await importSheetRowsAction(sessionId, rows);
      setResult(r);
      setPreview(null);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Import sign-ups from Google Sheet
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Pull participants straight from the linked sign-up sheet — no copy-paste.
            </p>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>
            Import from sheet
          </Button>
        </div>
        {result && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Added {result.inserted} participant{result.inserted === 1 ? "" : "s"}
            {result.skipped ? ` · skipped ${result.skipped} already on the roster` : ""}.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Import sign-ups from Google Sheet
        </h2>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setPreview(null);
          }}
          className="text-xs text-neutral-500 hover:underline dark:text-neutral-400"
        >
          Close
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[16rem] flex-1">
          <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Sheet link (shared as “Anyone with the link → Viewer”)
          </label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/…"
          />
        </div>
        <Button type="button" onClick={fetchPreview} disabled={pending || !url.trim()}>
          {pending ? "Reading…" : "Preview"}
        </Button>
      </div>

      {preview && !preview.ok && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {preview.error}
        </p>
      )}

      {preview && preview.ok && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Found <span className="font-semibold text-neutral-900 dark:text-neutral-100">{preview.rows.length}</span>{" "}
            participants. Matched columns:{" "}
            <span className="text-neutral-500">{preview.mappedHeaders.join(", ")}</span>
          </p>
          <div className="max-h-72 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-900">
                <tr className="text-left text-xs text-neutral-500 dark:text-neutral-400">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Nationality</th>
                  <th className="px-3 py-2">School</th>
                  <th className="px-3 py-2">Tour</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 100).map((r, i) => (
                  <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="px-3 py-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                      {r.participant_name}
                    </td>
                    <td className="px-3 py-1.5 text-neutral-600 dark:text-neutral-400">{r.nationality ?? "—"}</td>
                    <td className="max-w-xs truncate px-3 py-1.5 text-neutral-600 dark:text-neutral-400">
                      {r.school ?? "—"}
                    </td>
                    <td className="px-3 py-1.5 text-neutral-600 dark:text-neutral-400">
                      {r.tour_booked === true ? "Yes" : r.tour_booked === false ? "No" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" onClick={() => runImport(preview.rows)} disabled={pending}>
              {pending ? "Importing…" : `Add ${preview.rows.length} to roster`}
            </Button>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Names already on the roster are skipped automatically.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
