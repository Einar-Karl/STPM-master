"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requiredString } from "@/lib/forms";
import type { Enums } from "@/lib/supabase/database.types";

export async function updateStaffRoleAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = requiredString(formData.get("id"));
  const role = requiredString(formData.get("role")) as Enums<"staff_role">;
  if (!id || !role) return;

  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/staff");
}
