// Provider-agnostic AI client. Every supported provider exposes an
// OpenAI-compatible /chat/completions endpoint, so switching provider or
// model is a settings change, not a code change. Config lives in the
// app_settings table (admin-editable in /ai-settings) with env fallbacks.
//
// Privacy rule: callers must only send aggregates and organisation-level
// data — never participant names, emails or phone numbers. Free-tier
// providers may retain or train on inputs.

import { createClient } from "@/lib/supabase/server";

export type AiProvider = "gemini" | "groq" | "openrouter" | "custom" | "mock";

export type AiConfig = {
  provider: AiProvider;
  model: string;
  apiKey: string | null;
  baseUrl: string;
  enabled: boolean;
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const PROVIDERS: { value: AiProvider; label: string; baseUrl: string; defaultModel: string; keyHint: string }[] = [
  {
    value: "gemini",
    label: "Google Gemini (free tier)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.5-flash",
    keyHint: "Create a free key at aistudio.google.com → Get API key",
  },
  {
    value: "groq",
    label: "Groq (free tier)",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    keyHint: "Create a free key at console.groq.com",
  },
  {
    value: "openrouter",
    label: "OpenRouter (free models)",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    keyHint: "Create a key at openrouter.ai/keys",
  },
  {
    value: "custom",
    label: "Custom (any OpenAI-compatible URL)",
    baseUrl: "",
    defaultModel: "",
    keyHint: "Point at any OpenAI-compatible endpoint (Ollama, vLLM, paid APIs…)",
  },
  {
    value: "mock",
    label: "Mock (no key needed)",
    baseUrl: "",
    defaultModel: "mock",
    keyHint: "Built-in stub responses until you plug in a real provider",
  },
];

export function providerMeta(provider: AiProvider) {
  return PROVIDERS.find((p) => p.value === provider) ?? PROVIDERS[0];
}

export async function getAiConfig(): Promise<AiConfig> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["ai_provider", "ai_model", "ai_api_key", "ai_base_url", "ai_enabled"]);

  const map = new Map((data ?? []).map((r) => [r.key, r.value] as const));
  const provider = (map.get("ai_provider") as AiProvider) || "mock";
  const meta = providerMeta(provider);

  return {
    provider,
    model: map.get("ai_model") || meta.defaultModel,
    apiKey: map.get("ai_api_key") || process.env.AI_API_KEY || null,
    baseUrl: map.get("ai_base_url") || meta.baseUrl,
    enabled: (map.get("ai_enabled") ?? "true") !== "false",
  };
}

function mockReply(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  return [
    "(Mock AI — no provider configured yet.)",
    "",
    "An admin can plug in a free model under Admin → AI Settings (Gemini, Groq or OpenRouter — the key takes one minute to create). Until then I can only echo the essentials:",
    "",
    `You asked: "${lastUser.slice(0, 280)}${lastUser.length > 280 ? "…" : ""}"`,
    "",
    "Once a provider is connected I'll answer this properly using the live data digest.",
  ].join("\n");
}

/**
 * One chat completion round-trip. Throws with a readable message on failure —
 * callers surface it to the UI. Falls back to the mock reply when the
 * provider is "mock" or no API key is configured.
 */
export async function chatComplete(
  messages: ChatMessage[],
  opts?: { config?: AiConfig; temperature?: number; maxTokens?: number }
): Promise<string> {
  const config = opts?.config ?? (await getAiConfig());

  if (!config.enabled) {
    throw new Error("The AI assistant is turned off in AI Settings.");
  }
  if (config.provider === "mock" || !config.apiKey) {
    return mockReply(messages);
  }

  const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: opts?.temperature ?? 0.4,
      max_tokens: opts?.maxTokens ?? 1024,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const text = (await res.text()).slice(0, 300);
    throw new Error(`AI provider error (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty response.");
  return content.trim();
}
