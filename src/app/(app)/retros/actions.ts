"use server";

import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { chatComplete, type ChatMessage } from "@/lib/ai";
import { formatDateRange } from "@/lib/planner";

export async function askRetroAiAction(question: string): Promise<{ ok: boolean; text: string }> {
  await requireStaff();
  const supabase = await createClient();

  const [{ data: retros }, { data: weeks }] = await Promise.all([
    supabase.from("week_retros").select("week_id, went_well, could_improve, rating, created_at").order("created_at", { ascending: false }).limit(60),
    supabase.from("course_weeks").select("id, start_date, end_date, location, channel"),
  ]);

  if (!retros?.length) {
    return { ok: false, text: "No retro entries yet — fill in a retro on a course week first." };
  }

  const weekLabel = new Map(
    (weeks ?? []).map((w) => [w.id, `${formatDateRange(w.start_date, w.end_date)} ${w.location} (${w.channel})`] as const)
  );

  const digest = retros
    .map((r) => {
      const parts = [
        `Week: ${weekLabel.get(r.week_id) ?? "unknown"}`,
        r.rating ? `Rating: ${r.rating}/5` : null,
        r.went_well ? `Went well: ${r.went_well}` : null,
        r.could_improve ? `Could improve: ${r.could_improve}` : null,
      ];
      return parts.filter(Boolean).join(" | ");
    })
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are an operations coach for STPM, a small company running teacher-training course weeks. You receive the team's retro entries (what went well / what could be better, per course week). Find recurring themes and propose concrete, low-cost changes to how the weeks and the business are run. Group by theme, cite which weeks the theme showed up in, and keep it under 300 words.",
    },
    {
      role: "user",
      content: `Retro entries:\n\n${digest}\n\n${
        question.trim() ? `Question: ${question.trim()}` : "What should we change, and what should we keep doing?"
      }`,
    },
  ];

  try {
    return { ok: true, text: await chatComplete(messages, { maxTokens: 800 }) };
  } catch (err) {
    return { ok: false, text: err instanceof Error ? err.message : "AI call failed." };
  }
}
