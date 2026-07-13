import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Server-only Supabase client using the service-role key. It bypasses Row Level
 * Security, so it must ONLY be used in trusted server code (e.g. the registration
 * webhook, which authenticates callers with a shared secret first). Never import
 * this into client components.
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY isn't configured, so callers can
 * fail safely instead of running with the anon key.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
