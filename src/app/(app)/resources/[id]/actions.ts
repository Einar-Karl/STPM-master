"use server";

import { revalidatePath } from "next/cache";
import { createdByOrNull, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";

export async function createResourceBookingAction(formData: FormData) {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const resourceId = requiredString(formData.get("resource_id"));
  const title = requiredString(formData.get("title"));
  const startAt = requiredString(formData.get("start_at"));
  const endAt = requiredString(formData.get("end_at"));
  if (!resourceId || !title || !startAt || !endAt) return;

  await supabase.from("resource_bookings").insert({
    resource_id: resourceId,
    title,
    start_at: new Date(startAt).toISOString(),
    end_at: new Date(endAt).toISOString(),
    course_session_id: emptyToNull(formData.get("course_session_id")),
    notes: emptyToNull(formData.get("notes")),
    created_by: createdByOrNull(profile),
  });

  revalidatePath(`/resources/${resourceId}`);
}

export async function deleteResourceBookingAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  const resourceId = requiredString(formData.get("resource_id"));
  if (!id) return;

  await supabase.from("resource_bookings").delete().eq("id", id);
  revalidatePath(`/resources/${resourceId}`);
}
