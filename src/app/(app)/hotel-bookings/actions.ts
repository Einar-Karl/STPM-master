"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";
import type { Enums } from "@/lib/supabase/database.types";

export async function createHotelBookingAction(formData: FormData) {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const hotelId = requiredString(formData.get("hotel_id"));
  const guestName = requiredString(formData.get("guest_name"));
  const checkIn = requiredString(formData.get("check_in"));
  const checkOut = requiredString(formData.get("check_out"));
  if (!hotelId || !guestName || !checkIn || !checkOut) return;

  await supabase.from("hotel_bookings").insert({
    hotel_id: hotelId,
    room_id: emptyToNull(formData.get("room_id")),
    client_id: emptyToNull(formData.get("client_id")),
    guest_name: guestName,
    guests: Number(formData.get("guests")) || 1,
    check_in: checkIn,
    check_out: checkOut,
    status: requiredString(formData.get("status")) as Enums<"booking_status">,
    course_session_id: emptyToNull(formData.get("course_session_id")),
    notes: emptyToNull(formData.get("notes")),
    created_by: profile.id,
  });

  revalidatePath("/hotel-bookings");
}

export async function updateHotelBookingStatusAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  const status = requiredString(formData.get("status")) as Enums<"booking_status">;
  if (!id || !status) return;

  await supabase.from("hotel_bookings").update({ status }).eq("id", id);
  revalidatePath("/hotel-bookings");
}

export async function deleteHotelBookingAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  if (!id) return;

  await supabase.from("hotel_bookings").delete().eq("id", id);
  revalidatePath("/hotel-bookings");
}
