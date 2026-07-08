"use server";

import { revalidatePath } from "next/cache";
import { createdByOrNull, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, optionalNumber, requiredString } from "@/lib/forms";

export async function createSessionAction(formData: FormData) {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const courseId = requiredString(formData.get("course_id"));
  const startDate = requiredString(formData.get("start_date"));
  const endDate = requiredString(formData.get("end_date"));
  if (!courseId || !startDate || !endDate) return;

  await supabase.from("course_sessions").insert({
    course_id: courseId,
    location: emptyToNull(formData.get("location")),
    start_date: startDate,
    end_date: endDate,
    capacity: optionalNumber(formData.get("capacity")),
    notes: emptyToNull(formData.get("notes")),
    created_by: createdByOrNull(profile),
  });

  revalidatePath(`/courses/${courseId}`);
}

export async function deleteSessionAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  const courseId = requiredString(formData.get("course_id"));
  if (!id) return;

  await supabase.from("course_sessions").delete().eq("id", id);
  revalidatePath(`/courses/${courseId}`);
}
