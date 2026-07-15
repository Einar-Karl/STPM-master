"use server";

import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { chatComplete, type ChatMessage } from "@/lib/ai";
import { formatDateRange } from "@/lib/planner";

export type AssistantTurn = { role: "user" | "assistant"; content: string };

// Pages the assistant may link to, with what lives there. Keeping this list
// explicit doubles as the assistant's map of the product.
const PAGE_DIRECTORY = `
/dashboard — year timeline of course weeks, stats, upcoming weeks
/weeks — all course weeks (filter by channel); /weeks/<id> — one week: staffing, location, day-by-day itinerary (editable + shareable)
/sessions/<id> — one course run: participant roster
/sales — sales overview: market stats, suggested moves, leads pipeline (board & list); /sales/<id> — one lead: details, outreach draft, activity log
/retros — course-week retros (what went well / what to improve) and AI improvement suggestions
/teachers — assignable teacher list
/courses — course catalog
/course-bookings — all participant bookings
/clients — client records
/hotels, /hotel-bookings — accommodation
/resources — internal bookable resources
/staff — staff accounts & role approval (admins)
/ai-settings — AI provider configuration (admins)`;

async function buildSiteDigest(): Promise<string> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: weeks }, { data: sessions }, { data: bookings }, { data: leads }, { data: courses }, { data: teachers }] =
    await Promise.all([
      supabase.from("course_weeks").select("id, start_date, end_date, location, channel").order("start_date"),
      supabase.from("course_sessions").select("id, week_id, lead_teacher_id"),
      supabase.from("course_bookings").select("session_id, status, payment_status, nationality"),
      supabase.from("sales_leads").select("stage, channel"),
      supabase.from("courses").select("name"),
      supabase.from("teachers").select("name, active"),
    ]);

  const sessionWeek = new Map<string, string>();
  const staffed = new Map<string, { staffed: number; total: number }>();
  for (const s of sessions ?? []) {
    if (!s.week_id) continue;
    sessionWeek.set(s.id, s.week_id);
    const agg = staffed.get(s.week_id) ?? { staffed: 0, total: 0 };
    agg.total += 1;
    if (s.lead_teacher_id) agg.staffed += 1;
    staffed.set(s.week_id, agg);
  }

  const participantsByWeek = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  let active = 0;
  let paid = 0;
  let pending = 0;
  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    active += 1;
    if ((b.payment_status ?? "").toUpperCase() === "PAID") paid += 1;
    else if ((b.payment_status ?? "").toUpperCase() === "PENDING") pending += 1;
    const wk = sessionWeek.get(b.session_id);
    if (wk) participantsByWeek.set(wk, (participantsByWeek.get(wk) ?? 0) + 1);
    const nat = (b.nationality ?? "").trim();
    if (nat) countryCounts.set(nat, (countryCounts.get(nat) ?? 0) + 1);
  }

  const upcoming = (weeks ?? [])
    .filter((w) => w.end_date >= today)
    .slice(0, 12)
    .map((w) => {
      const agg = staffed.get(w.id) ?? { staffed: 0, total: 0 };
      return `- ${formatDateRange(w.start_date, w.end_date)} · ${w.location} · ${w.channel} · ${
        participantsByWeek.get(w.id) ?? 0
      } participants · ${agg.staffed}/${agg.total} courses staffed · link: /weeks/${w.id}`;
    })
    .join("\n");

  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([c, n]) => `${c} (${n})`)
    .join(", ");

  const pipeline = new Map<string, number>();
  for (const l of leads ?? []) pipeline.set(l.stage, (pipeline.get(l.stage) ?? 0) + 1);

  return [
    `Today: ${today}`,
    `Totals: ${weeks?.length ?? 0} course weeks, ${active} active participants (${paid} paid, ${pending} payment pending).`,
    `Top participant countries: ${topCountries || "n/a"}.`,
    `Sales pipeline (innie leads): ${[...pipeline.entries()].map(([s, n]) => `${s}: ${n}`).join(", ") || "empty"}.`,
    `Courses in catalog: ${(courses ?? []).map((c) => c.name).join("; ")}.`,
    `Teachers: ${(teachers ?? []).map((t) => `${t.name}${t.active ? "" : " (inactive)"}`).join(", ")}.`,
    "",
    "Upcoming / current course weeks:",
    upcoming || "(none)",
  ].join("\n");
}

export async function askAssistantAction(history: AssistantTurn[]): Promise<{ ok: boolean; text: string }> {
  await requireStaff();

  const digest = await buildSiteDigest();
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are the STPM Master assistant, built into the internal booking & planning tool of STPM (Smart Teachers Play More / Endurmenntunarferðir). You help staff find things and understand the data.

Rules:
- You are READ-ONLY: you cannot change any data. When the user wants to change something, tell them where to do it and give the link.
- Answer from the digest below. If the digest doesn't contain the answer (e.g. a specific participant), say so and link to the page where they can look it up ([Course Bookings](/course-bookings), a week page, etc.). Never invent numbers.
- Link pages using markdown: [label](/path). Use paths from the page directory.
- Match the user's language (English or Icelandic). Be brief and concrete.

Page directory:${PAGE_DIRECTORY}

Live data digest:
${digest}`,
    },
    ...history.slice(-10).map((t) => ({ role: t.role, content: t.content }) as ChatMessage),
  ];

  try {
    return { ok: true, text: await chatComplete(messages, { maxTokens: 700 }) };
  } catch (err) {
    return { ok: false, text: err instanceof Error ? err.message : "AI call failed." };
  }
}
