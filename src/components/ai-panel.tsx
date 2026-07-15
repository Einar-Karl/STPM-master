"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";

export type AiResult = { ok: boolean; text: string };

/**
 * Small reusable "ask the AI" panel. The server action receives the optional
 * free-text question and returns the model's answer (or an error message).
 */
export function AiPanel({
  action,
  buttonLabel = "Generate",
  placeholder = "Optional: ask something specific…",
  intro,
}: {
  action: (question: string) => Promise<AiResult>;
  buttonLabel?: string;
  placeholder?: string;
  intro?: string;
}) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AiResult | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      try {
        setResult(await action(question));
      } catch {
        setResult({ ok: false, text: "Something went wrong calling the AI. Try again." });
      }
    });
  }

  return (
    <div className="space-y-3">
      {intro && <p className="text-xs text-neutral-500 dark:text-neutral-400">{intro}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !pending) run();
          }}
          placeholder={placeholder}
          className="min-w-[200px] flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
        <Button type="button" onClick={run} disabled={pending}>
          {pending ? "Thinking…" : buttonLabel}
        </Button>
      </div>
      {result && (
        <div
          className={`rounded-md border p-3 text-sm ${
            result.ok
              ? "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans">{result.text}</pre>
        </div>
      )}
    </div>
  );
}
