"use server";

import { revalidatePath } from "next/cache";
import { createdByOrNull, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";
import type { Enums } from "@/lib/supabase/database.types";

export async function createCourseBookingAction(formData: FormData) {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const sessionId = requiredString(formData.get("session_id"));
  const participantName = requiredString(formData.get("participant_name"));
  if (!sessionId || !participantName) return;

  await supabase.from("course_bookings").insert({
    session_id: sessionId,
    client_id: emptyToNull(formData.get("client_id")),
    participant_name: participantName,
    participant_email: emptyToNull(formData.get("participant_email")),
    seats: Number(formData.get("seats")) || 1,
    status: requiredString(formData.get("status")) as Enums<"booking_status">,
    notes: emptyToNull(formData.get("notes")),
    created_by: createdByOrNull(profile),
  });

  revalidatePath("/course-bookings");
}

export async function updateCourseBookingStatusAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  const status = requiredString(formData.get("status")) as Enums<"booking_status">;
  if (!id || !status) return;

  await supabase.from("course_bookings").update({ status }).eq("id", id);
  revalidatePath("/course-bookings");
}

export async function deleteCourseBookingAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  if (!id) return;

  await supabase.from("course_bookings").delete().eq("id", id);
  revalidatePath("/course-bookings");
}
