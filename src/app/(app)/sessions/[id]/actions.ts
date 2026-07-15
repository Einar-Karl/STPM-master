"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";

export async function updateSessionDayAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const dayId = requiredString(formData.get("day_id"));
  const sessionId = requiredString(formData.get("session_id"));
  if (!dayId) return;

  await supabase
    .from("course_session_days")
    .update({
      title: emptyToNull(formData.get("title")),
      notes: emptyToNull(formData.get("notes")),
    })
    .eq("id", dayId);

  revalidatePath(`/sessions/${sessionId}`);
}

export async function updateRegistrationKeyAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const sessionId = requiredString(formData.get("session_id"));
  if (!sessionId) return;

  await supabase
    .from("course_sessions")
    .update({ registration_key: emptyToNull(formData.get("registration_key")) })
    .eq("id", sessionId);

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/registrations");
}
