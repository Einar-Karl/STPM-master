"use server";

import { revalidatePath } from "next/cache";
import { createdByOrNull, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, optionalNumber, requiredString } from "@/lib/forms";

export async function createCourseAction(formData: FormData) {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const name = requiredString(formData.get("name"));
  if (!name) return;

  await supabase.from("courses").insert({
    name,
    description: emptyToNull(formData.get("description")),
    duration_days: optionalNumber(formData.get("duration_days")),
    price: optionalNumber(formData.get("price")),
    created_by: createdByOrNull(profile),
  });

  revalidatePath("/courses");
}

export async function deleteCourseAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = requiredString(formData.get("id"));
  if (!id) return;

  await supabase.from("courses").delete().eq("id", id);
  revalidatePath("/courses");
}
