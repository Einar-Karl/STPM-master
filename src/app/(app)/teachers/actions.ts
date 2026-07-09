"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";

export async function createTeacherAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const name = requiredString(formData.get("name"));
  if (!name) return;

  await supabase.from("teachers").insert({
    name,
    code: emptyToNull(formData.get("code")),
    specializations: emptyToNull(formData.get("specializations")),
  });

  revalidatePath("/teachers");
}

export async function toggleTeacherActiveAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const id = requiredString(formData.get("id"));
  const active = requiredString(formData.get("active")) === "true";
  if (!id) return;

  await supabase.from("teachers").update({ active: !active }).eq("id", id);
  revalidatePath("/teachers");
}
