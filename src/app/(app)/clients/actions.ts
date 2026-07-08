"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";
import type { Enums } from "@/lib/supabase/database.types";

export async function createClientAction(formData: FormData) {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const name = requiredString(formData.get("name"));
  if (!name) return;

  await supabase.from("clients").insert({
    name,
    type: requiredString(formData.get("type")) as Enums<"client_type">,
    contact_person: emptyToNull(formData.get("contact_person")),
    email: emptyToNull(formData.get("email")),
    phone: emptyToNull(formData.get("phone")),
    notes: emptyToNull(formData.get("notes")),
    created_by: profile.id,
  });

  revalidatePath("/clients");
}

export async function deleteClientAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  if (!id) return;

  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/clients");
}
