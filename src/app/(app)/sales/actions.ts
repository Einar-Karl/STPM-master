"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, createdByOrNull } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";
import { chatComplete, type ChatMessage } from "@/lib/ai";
import type { SalesStage } from "@/lib/sales";

const STAGES: SalesStage[] = ["new", "contacted", "interested", "negotiating", "won", "lost"];

function parseStage(value: FormDataEntryValue | null): SalesStage {
  const s = requiredString(value);
  return (STAGES as string[]).includes(s) ? (s as SalesStage) : "new";
}

export async function updateLeadAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const id = requiredString(formData.get("lead_id"));
  if (!id) return;

  await supabase
    .from("sales_leads")
    .update({
      email: emptyToNull(formData.get("email")),
      phone: emptyToNull(formData.get("phone")),
      contact_person: emptyToNull(formData.get("contact_person")),
      website: emptyToNull(formData.get("website")),
      stage: parseStage(formData.get("stage")),
      next_follow_up_at: emptyToNull(formData.get("next_follow_up_at")),
      notes: emptyToNull(formData.get("notes")),
    })
    .eq("id", id);

  revalidatePath(`/sales/${id}`);
  revalidatePath("/sales");
}

export async function markContactedAction(formData: FormData) {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const id = requiredString(formData.get("lead_id"));
  if (!id) return;

  const { data: lead } = await supabase
    .from("sales_leads")
    .select("stage")
    .eq("id", id)
    .single();

  // Only advance an untouched lead; keep more-advanced stages as they are.
  const nextStage = lead && lead.stage === "new" ? "contacted" : lead?.stage;

  await supabase
    .from("sales_leads")
    .update({ last_contacted_at: new Date().toISOString(), stage: nextStage })
    .eq("id", id);

  await supabase.from("sales_activities").insert({
    lead_id: id,
    kind: "email",
    body: emptyToNull(formData.get("note")) ?? "Marked as contacted.",
    created_by: createdByOrNull(profile),
  });

  revalidatePath(`/sales/${id}`);
  revalidatePath("/sales");
}

export async function addActivityAction(formData: FormData) {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const id = requiredString(formData.get("lead_id"));
  const body = emptyToNull(formData.get("body"));
  if (!id || !body) return;

  const kind = requiredString(formData.get("kind")) || "note";

  await supabase.from("sales_activities").insert({
    lead_id: id,
    kind,
    body,
    created_by: createdByOrNull(profile),
  });

  // A logged call/meeting also counts as contact.
  if (kind === "call" || kind === "meeting" || kind === "email") {
    await supabase
      .from("sales_leads")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", id);
  }

  revalidatePath(`/sales/${id}`);
}

export async function setLeadStageAction(leadId: string, stage: SalesStage) {
  const { profile } = await requireStaff();
  const supabase = await createClient();
  if (!leadId || !(STAGES as string[]).includes(stage)) return;

  await supabase.from("sales_leads").update({ stage }).eq("id", leadId);
  await supabase.from("sales_activities").insert({
    lead_id: leadId,
    kind: "stage",
    body: `Moved to ${stage}.`,
    created_by: createdByOrNull(profile),
  });

  revalidatePath("/sales");
  revalidatePath(`/sales/${leadId}`);
}

export async function addLeadAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const name = requiredString(formData.get("name"));
  if (!name) return;

  const channel = requiredString(formData.get("channel")) === "outie" ? "outie" : "innie";

  await supabase.from("sales_leads").insert({
    name,
    channel,
    org_type: requiredString(formData.get("org_type")) || "school",
    municipality: emptyToNull(formData.get("municipality")),
    email: emptyToNull(formData.get("email")),
    contact_person: emptyToNull(formData.get("contact_person")),
    website: emptyToNull(formData.get("website")),
  });

  revalidatePath("/sales");
}

// ---------------------------------------------------------------------------
// AI sales assistant. Privacy rule: only aggregates and organisation-level
// data leave the app — no participant names, emails or phone numbers.
// ---------------------------------------------------------------------------

type AiResult = { ok: boolean; text: string };

async function runAi(messages: ChatMessage[]): Promise<AiResult> {
  try {
    return { ok: true, text: await chatComplete(messages) };
  } catch (err) {
    return { ok: false, text: err instanceof Error ? err.message : "AI call failed." };
  }
}

async function buildChannelDigest(channel: "innie" | "outie"): Promise<string> {
  const supabase = await createClient();
  const [{ data: weeks }, { data: sessions }, { data: bookings }, { data: leads }] =
    await Promise.all([
      supabase.from("course_weeks").select("id, channel, location, start_date, end_date"),
      supabase.from("course_sessions").select("id, week_id"),
      supabase.from("course_bookings").select("session_id, nationality, coordinator, status"),
      supabase.from("sales_leads").select("org_type, municipality, stage, email, last_contacted_at").eq("channel", channel),
    ]);

  const weekChannel = new Map<string, string>();
  const destinations = new Set<string>();
  for (const w of weeks ?? []) {
    weekChannel.set(w.id, w.channel);
    if (w.location.toLowerCase() !== "iceland") destinations.add(w.location);
  }
  const sessionChannel = new Map<string, string>();
  for (const s of sessions ?? []) {
    const ch = s.week_id ? weekChannel.get(s.week_id) : undefined;
    if (ch) sessionChannel.set(s.id, ch);
  }

  const countryCounts = new Map<string, number>();
  const coordinatorSizes = new Map<string, number>();
  let total = 0;
  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    if (sessionChannel.get(b.session_id) !== channel) continue;
    total += 1;
    const nat = (b.nationality ?? "").trim();
    if (nat) countryCounts.set(nat, (countryCounts.get(nat) ?? 0) + 1);
    const coord = (b.coordinator ?? "").trim();
    if (coord) coordinatorSizes.set(coord, (coordinatorSizes.get(coord) ?? 0) + 1);
  }
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([c, n]) => `${c}: ${n}`)
    .join(", ");
  const groupSizes = [...coordinatorSizes.values()].filter((n) => n >= 3).sort((a, b) => b - a);

  const stageCounts = new Map<string, number>();
  let missingEmail = 0;
  for (const l of leads ?? []) {
    stageCounts.set(l.stage, (stageCounts.get(l.stage) ?? 0) + 1);
    if (!l.email) missingEmail += 1;
  }
  const pipeline = [...stageCounts.entries()].map(([s, n]) => `${s}: ${n}`).join(", ") || "empty";

  return [
    `Channel: ${channel === "outie" ? "Outies — foreign teachers coming to STPM courses (smartteachersplaymore.com)" : "Innies — Icelandic teachers/school groups travelling abroad (endurmenntunarferdir.is)"}`,
    `Active participants this year: ${total}`,
    `Top countries by participants: ${topCountries || "n/a"}`,
    `Group bookings via coordinators (sizes of groups with 3+ people, names withheld): ${groupSizes.join(", ") || "none"}`,
    `Course destinations besides Iceland: ${[...destinations].join(", ") || "none"}`,
    `Sales pipeline (${leads?.length ?? 0} leads): ${pipeline}; ${missingEmail} leads missing an email address`,
  ].join("\n");
}

export async function askSalesAiAction(channel: "innie" | "outie", question: string): Promise<AiResult> {
  await requireStaff();
  const digest = await buildChannelDigest(channel);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a pragmatic sales advisor for STPM (Smart Teachers Play More), a small Icelandic company running Erasmus+ teacher-training weeks. Give specific, low-budget, actionable advice a 2-3 person team can execute. Use short paragraphs or numbered steps. Do not invent data beyond the digest.",
    },
    {
      role: "user",
      content: `Here is the current sales data digest:\n\n${digest}\n\n${
        question.trim()
          ? `Question: ${question.trim()}`
          : "Suggest the 5 highest-impact sales moves for the next 30 days, ordered by impact, each with a concrete first step."
      }`,
    },
  ];

  return runAi(messages);
}

export async function askLeadAiAction(leadId: string, question: string): Promise<AiResult> {
  await requireStaff();
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("sales_leads")
    .select("name, org_type, municipality, stage, email, last_contacted_at, next_follow_up_at, notes, channel")
    .eq("id", leadId)
    .single();
  if (!lead) return { ok: false, text: "Lead not found." };

  const { data: activities } = await supabase
    .from("sales_activities")
    .select("kind, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(10);

  const daysSince = lead.last_contacted_at
    ? Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / 86_400_000)
    : null;
  const history = (activities ?? [])
    .map((a) => `${a.kind} on ${a.created_at.slice(0, 10)}`)
    .join("; ");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a sales coach for STPM / Endurmenntunarferðir, which sells organised study trips abroad to Icelandic schools and kindergartens. Recommend the single best next move for this lead and, if outreach is the move, a 2-3 sentence hook they could use (in Icelandic if the lead is Icelandic). Be concrete and brief.",
    },
    {
      role: "user",
      content: [
        `Lead (organisation): ${lead.name}`,
        `Type: ${lead.org_type}; Town: ${lead.municipality ?? "unknown"}`,
        `Pipeline stage: ${lead.stage}`,
        `Email on file: ${lead.email ? "yes" : "no"}`,
        `Days since last contact: ${daysSince ?? "never contacted"}`,
        `Follow-up date set: ${lead.next_follow_up_at ?? "none"}`,
        `Recent activity: ${history || "none"}`,
        lead.notes ? `Staff notes: ${lead.notes.slice(0, 400)}` : "",
        "",
        question.trim() ? `Question: ${question.trim()}` : "What is the best next move for this lead?",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  return runAi(messages);
}
