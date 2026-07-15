"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requiredString } from "@/lib/forms";
import { chatComplete, getAiConfig } from "@/lib/ai";

export async function saveAiSettingsAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const entries: { key: string; value: string | null }[] = [
    { key: "ai_provider", value: requiredString(formData.get("provider")) || "mock" },
    { key: "ai_model", value: requiredString(formData.get("model")) || null },
    { key: "ai_base_url", value: requiredString(formData.get("base_url")) || null },
    { key: "ai_enabled", value: formData.get("enabled") === "on" ? "true" : "false" },
  ];

  // Leave the stored key untouched unless a new one was typed (the field is
  // never pre-filled, so an empty submit means "keep what's there").
  const apiKey = requiredString(formData.get("api_key"));
  if (apiKey) entries.push({ key: "ai_api_key", value: apiKey });
  if (formData.get("clear_key") === "on") entries.push({ key: "ai_api_key", value: null });

  await supabase
    .from("app_settings")
    .upsert(entries.map((e) => ({ ...e, updated_at: new Date().toISOString() })));

  revalidatePath("/ai-settings");
  redirect("/ai-settings?saved=1");
}

export async function testAiAction() {
  await requireAdmin();
  try {
    const config = await getAiConfig();
    const reply = await chatComplete(
      [
        { role: "system", content: "You are a connectivity test. Reply with one short sentence." },
        { role: "user", content: "Say hello and name the model you are." },
      ],
      { config, maxTokens: 60 }
    );
    redirect(`/ai-settings?test=ok&msg=${encodeURIComponent(reply.slice(0, 200))}`);
  } catch (err) {
    // redirect() throws internally — let those through.
    if (err && typeof err === "object" && "digest" in err) throw err;
    const msg = err instanceof Error ? err.message : "Unknown error";
    redirect(`/ai-settings?test=fail&msg=${encodeURIComponent(msg.slice(0, 200))}`);
  }
}
