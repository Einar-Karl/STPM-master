"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requiredString } from "@/lib/forms";
import { checklistTemplate, type PrepRole } from "@/lib/checklists";

// Prep checklist actions shared by the week page (planner) and the session
// page (teacher). Each form carries role + week_id or session_id so we know
// which checklist to touch and which page to refresh.

type Scope = { role: PrepRole; weekId: string | null; sessionId: string | null; path: string };

function readScope(formData: FormData): Scope | null {
  const role = requiredString(formData.get("role"));
  const weekId = requiredString(formData.get("week_id")) || null;
  const sessionId = requiredString(formData.get("session_id")) || null;
  if (role !== "planner" && role !== "teacher") return null;
  if (role === "planner" && !weekId) return null;
  if (role === "teacher" && !sessionId) return null;
  return {
    role,
    weekId: role === "planner" ? weekId : null,
    sessionId: role === "teacher" ? sessionId : null,
    path: role === "planner" ? `/weeks/${weekId}` : `/sessions/${sessionId}`,
  };
}

export async function seedPrepTasksAction(formData: FormData) {
  await requireStaff();
  const scope = readScope(formData);
  if (!scope) return;
  const supabase = await createClient();

  const existing = supabase.from("prep_tasks").select("label");
  const { data: current } = await (scope.weekId
    ? existing.eq("week_id", scope.weekId)
    : existing.eq("session_id", scope.sessionId ?? ""));
  const have = new Set((current ?? []).map((t) => t.label));

  const rows = checklistTemplate(scope.role)
    .map((label, i) => ({
      role: scope.role,
      week_id: scope.weekId,
      session_id: scope.sessionId,
      label,
      sort_order: i,
    }))
    .filter((r) => !have.has(r.label));
  if (rows.length) await supabase.from("prep_tasks").insert(rows);

  revalidatePath(scope.path);
}

export async function togglePrepTaskAction(formData: FormData) {
  await requireStaff();
  const scope = readScope(formData);
  const taskId = requiredString(formData.get("task_id"));
  if (!scope || !taskId) return;
  const supabase = await createClient();

  await supabase
    .from("prep_tasks")
    .update({ done: formData.get("done") === "1" })
    .eq("id", taskId);

  revalidatePath(scope.path);
}

export async function addPrepTaskAction(formData: FormData) {
  await requireStaff();
  const scope = readScope(formData);
  const label = requiredString(formData.get("label"));
  if (!scope || !label) return;
  const supabase = await createClient();

  await supabase.from("prep_tasks").insert({
    role: scope.role,
    week_id: scope.weekId,
    session_id: scope.sessionId,
    label,
    sort_order: 500, // custom items go after the standard plan
  });

  revalidatePath(scope.path);
}

export async function deletePrepTaskAction(formData: FormData) {
  await requireStaff();
  const scope = readScope(formData);
  const taskId = requiredString(formData.get("task_id"));
  if (!scope || !taskId) return;
  const supabase = await createClient();

  await supabase.from("prep_tasks").delete().eq("id", taskId);

  revalidatePath(scope.path);
}
