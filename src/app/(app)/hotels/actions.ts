"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";

export async function createHotelAction(formData: FormData) {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const name = requiredString(formData.get("name"));
  if (!name) return;

  await supabase.from("hotels").insert({
    name,
    address: emptyToNull(formData.get("address")),
    contact_info: emptyToNull(formData.get("contact_info")),
    notes: emptyToNull(formData.get("notes")),
    created_by: profile.id,
  });

  revalidatePath("/hotels");
}

export async function deleteHotelAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  if (!id) return;

  await supabase.from("hotels").delete().eq("id", id);
  revalidatePath("/hotels");
}
