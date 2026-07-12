"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, createdByOrNull } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";
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
