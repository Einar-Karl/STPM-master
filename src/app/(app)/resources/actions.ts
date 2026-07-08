"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";
import type { Enums } from "@/lib/supabase/database.types";

export async function createResourceAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const name = requiredString(formData.get("name"));
  if (!name) return;

  await supabase.from("resources").insert({
    name,
    type: requiredString(formData.get("type")) as Enums<"resource_type">,
    description: emptyToNull(formData.get("description")),
  });

  revalidatePath("/resources");
}

export async function deleteResourceAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  if (!id) return;

  await supabase.from("resources").delete().eq("id", id);
  revalidatePath("/resources");
}
