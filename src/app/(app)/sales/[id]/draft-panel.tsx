"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { buildSchoolDraftEn, buildSchoolDraftIs, mailtoUrl } from "@/lib/sales";

export function DraftPanel({
  name,
  orgType,
  email,
  destinations,
}: {
  name: string;
  orgType: string;
  email: string | null;
  destinations: string[];
}) {
  const [lang, setLang] = useState<"is" | "en">("is");
  const [copied, setCopied] = useState(false);

  const draft = useMemo(
    () =>
      lang === "is"
        ? buildSchoolDraftIs(name, orgType, destinations)
        : buildSchoolDraftEn(name, orgType, destinations),
    [lang, name, orgType, destinations]
  );

  const fullText = `${draft.subject}\n\n${draft.body}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the draft:", fullText);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["is", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium uppercase transition-colors ${
                lang === l
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {l === "is" ? "Íslenska" : "English"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={copy} className="text-xs">
            {copied ? "Copied ✓" : "Copy draft"}
          </Button>
          {email && (
            <a
              href={mailtoUrl(email, draft.subject, draft.body)}
              className="rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Open in email
            </a>
          )}
        </div>
      </div>

      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Subject</p>
        <p className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">{draft.subject}</p>
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Body</p>
        <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-neutral-700 dark:text-neutral-300">
          {draft.body}
        </pre>
      </div>
      <p className="text-xs text-neutral-400">
        Replace the [bracketed] fields before sending. Tailored per school from the trips STPM runs.
      </p>
    </div>
  );
}
