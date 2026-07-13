"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, requiredString } from "@/lib/forms";
import { formatDateRange } from "@/lib/planner";

export async function createCourseWeekAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const start = requiredString(formData.get("start_date"));
  const end = requiredString(formData.get("end_date"));
  const location = requiredString(formData.get("location"));
  const channel = requiredString(formData.get("channel")) === "innie" ? "innie" : "outie";
  if (!start || !end || !location) redirect("/weeks/new?error=missing");
  if (end < start) redirect("/weeks/new?error=dates");

  const label = emptyToNull(formData.get("label")) ?? `${location} · ${formatDateRange(start, end)}`;

  const { data, error } = await supabase
    .from("course_weeks")
    .insert({
      start_date: start,
      end_date: end,
      location,
      channel,
      label,
      notes: emptyToNull(formData.get("notes")),
    })
    .select("id")
    .single();

  // The unique (start_date, location, channel) constraint blocks duplicates.
  if (error || !data) redirect(`/weeks/new?error=${encodeURIComponent(error?.code ?? "unknown")}`);

  revalidatePath("/weeks");
  redirect(`/weeks/${data.id}`);
}
