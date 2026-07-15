"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { askAssistantAction, type AssistantTurn } from "@/app/(app)/assistant-actions";

/** Render assistant text, turning [label](/path) into real links. */
function AssistantText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <Link key={i++} href={m[2]} className="font-medium text-sky-600 underline dark:text-sky-400">
        {m[1]}
      </Link>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span className="whitespace-pre-wrap">{parts}</span>;
}

const SUGGESTIONS = [
  "What's happening next week?",
  "How many payments are still pending?",
  "Which weeks are missing teachers?",
  "How is the sales pipeline looking?",
];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, pending]);

  function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    const history: AssistantTurn[] = [...turns, { role: "user", content }];
    setTurns(history);
    setInput("");
    startTransition(async () => {
      const res = await askAssistantAction(history);
      setTurns([...history, { role: "assistant", content: res.text }]);
    });
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open STPM assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-xl text-white shadow-lg transition-transform hover:scale-105 dark:bg-white dark:text-neutral-900"
      >
        {open ? "×" : "✨"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">STPM assistant</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Read-only — answers from live data and links you to the right page.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {turns.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Try asking:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full rounded-lg border border-neutral-200 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    t.role === "user"
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                  }`}
                >
                  {t.role === "assistant" ? <AssistantText text={t.content} /> : t.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-neutral-100 px-3 py-2 text-sm text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about weeks, bookings, sales…"
              className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
