"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setChannelFilterAction } from "@/app/(app)/channel-filter-actions";
import type { ChannelFilter } from "@/lib/channel-filter";

const OPTIONS: { value: ChannelFilter; label: string; activeClass: string }[] = [
  { value: "outie", label: "Outies", activeClass: "bg-sky-600 text-white" },
  { value: "innie", label: "Innies", activeClass: "bg-violet-600 text-white" },
];

export function ChannelFilterToggle({ initial }: { initial: ChannelFilter }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function apply(value: ChannelFilter) {
    if (value === initial) return;
    startTransition(async () => {
      await setChannelFilterAction(value);
      router.refresh();
    });
  }

  return (
    <div className="px-3 pb-2">
      <p className="mb-1.5 px-0 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        Channel
      </p>
      <div className={`flex gap-1 ${isPending ? "opacity-60" : ""}`}>
        {OPTIONS.map((opt) => {
          const active = initial === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => apply(opt.value)}
              aria-pressed={active}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? opt.activeClass
                  : "border border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
