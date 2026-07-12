"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setChannelFilterAction } from "@/app/(app)/channel-filter-actions";
import type { ChannelFilter } from "@/lib/channel-filter";

export function ChannelFilterToggle({ initial }: { initial: ChannelFilter }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const outieOn = initial === "both" || initial === "outie";
  const innieOn = initial === "both" || initial === "innie";

  function apply(nextOutie: boolean, nextInnie: boolean) {
    if (!nextOutie && !nextInnie) return; // always keep at least one on
    const value: ChannelFilter = nextOutie && nextInnie ? "both" : nextOutie ? "outie" : "innie";
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
        <button
          type="button"
          onClick={() => apply(!outieOn, innieOn)}
          aria-pressed={outieOn}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            outieOn
              ? "bg-sky-600 text-white"
              : "border border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          }`}
        >
          Outies
        </button>
        <button
          type="button"
          onClick={() => apply(outieOn, !innieOn)}
          aria-pressed={innieOn}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            innieOn
              ? "bg-violet-600 text-white"
              : "border border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          }`}
        >
          Innies
        </button>
      </div>
    </div>
  );
}
