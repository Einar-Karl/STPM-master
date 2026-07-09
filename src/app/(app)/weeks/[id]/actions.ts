"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";

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
