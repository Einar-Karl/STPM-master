"use server";

import { revalidatePath } from "next/cache";
import { createdByOrNull, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, optionalNumber, requiredString } from "@/lib/forms";

export async function assignTeachersAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const sessionId = requiredString(formData.get("session_id"));
  const weekId = requiredString(formData.get("week_id"));
  if (!sessionId) return;

  await supabase
    .from("course_sessions")
    .update({
      lead_teacher_id: emptyToNull(formData.get("lead_teacher_id")),
      support_teacher_id: emptyToNull(formData.get("support_teacher_id")),
    })
    .eq("id", sessionId);

  revalidatePath(`/weeks/${weekId}`);
}

export async function updateWeekLocationAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const weekId = requiredString(formData.get("week_id"));
  const location = requiredString(formData.get("location"));
  if (!weekId || !location) return;

  // Keep the week and all its sessions on the same location.
  await supabase.from("course_weeks").update({ location }).eq("id", weekId);
  await supabase.from("course_sessions").update({ location }).eq("week_id", weekId);

  revalidatePath(`/weeks/${weekId}`);
}

export async function addRetroAction(formData: FormData) {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const weekId = requiredString(formData.get("week_id"));
  const wentWell = emptyToNull(formData.get("went_well"));
  const couldImprove = emptyToNull(formData.get("could_improve"));
  if (!weekId || (!wentWell && !couldImprove)) return;

  const rating = optionalNumber(formData.get("rating"));

  await supabase.from("week_retros").insert({
    week_id: weekId,
    went_well: wentWell,
    could_improve: couldImprove,
    rating: rating && rating >= 1 && rating <= 5 ? rating : null,
    created_by: createdByOrNull(profile),
  });

  revalidatePath(`/weeks/${weekId}`);
  revalidatePath("/retros");
  revalidatePath("/dashboard");
}

export async function updateDayPlanAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const dayId = requiredString(formData.get("day_id"));
  const weekId = requiredString(formData.get("week_id"));
  if (!dayId) return;

  await supabase
    .from("course_week_days")
    .update({
      title: emptyToNull(formData.get("title")),
      notes: emptyToNull(formData.get("notes")),
    })
    .eq("id", dayId);

  revalidatePath(`/weeks/${weekId}`);
}
