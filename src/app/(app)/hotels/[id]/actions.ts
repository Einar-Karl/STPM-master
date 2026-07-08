"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requiredString } from "@/lib/forms";

export async function createRoomAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const hotelId = requiredString(formData.get("hotel_id"));
  const name = requiredString(formData.get("name"));
  if (!hotelId || !name) return;

  await supabase.from("hotel_rooms").insert({
    hotel_id: hotelId,
    name,
    room_type: requiredString(formData.get("room_type")) || null,
    capacity: Number(formData.get("capacity")) || 1,
  });

  revalidatePath(`/hotels/${hotelId}`);
}

export async function deleteRoomAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  const hotelId = requiredString(formData.get("hotel_id"));
  if (!id) return;

  await supabase.from("hotel_rooms").delete().eq("id", id);
  revalidatePath(`/hotels/${hotelId}`);
}
