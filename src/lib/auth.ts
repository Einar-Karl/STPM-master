import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

// Temporary escape hatch: set DISABLE_AUTH=true to use the app without
// signing in (e.g. before staff accounts have passwords set up). Every page
// still renders normally, but nothing is scoped to a real user. Remove the
// env var (or set it to anything other than "true") to require login again.
const AUTH_DISABLED = process.env.DISABLE_AUTH === "true";

const DISABLED_AUTH_PROFILE: Tables<"profiles"> = {
  id: "00000000-0000-0000-0000-000000000000",
  full_name: "Auth disabled",
  email: "auth-disabled@stpm.local",
  role: "admin",
  created_at: new Date(0).toISOString(),
};

export async function requireStaff(): Promise<{ profile: Tables<"profiles"> }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (AUTH_DISABLED) return { profile: DISABLED_AUTH_PROFILE };
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    if (AUTH_DISABLED) return { profile: DISABLED_AUTH_PROFILE };
    redirect("/login");
  }

  return { profile };
}

export async function requireAdmin(): Promise<{ profile: Tables<"profiles"> }> {
  const { profile } = await requireStaff();
  if (profile.role !== "admin" && !AUTH_DISABLED) redirect("/");
  return { profile };
}

// The disabled-auth profile isn't a real row in public.profiles, so it can't
// be used to satisfy the created_by foreign key. Use this instead of
// `profile.id` whenever inserting rows from a Server Action.
export function createdByOrNull(profile: Tables<"profiles">): string | null {
  return AUTH_DISABLED ? null : profile.id;
}
