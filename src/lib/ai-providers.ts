// Client-safe provider metadata — no server-only imports here, so this can
// be pulled into client components (e.g. the AI Settings form) directly.
//
// Free-tier model lineups shift often (a provider can 404 a model with no
// warning — it happened to gemini-2.5-flash in July 2026). Each provider
// lists its known-good free models for the dropdown, but the settings form
// always offers an "Other / type manually" escape hatch so a stale list
// never blocks someone from typing whatever model ID currently works.

export type AiProvider = "gemini" | "groq" | "openrouter" | "custom" | "mock";

export type AiModelOption = { id: string; label: string };

export type ProviderMeta = {
  value: AiProvider;
  label: string;
  baseUrl: string;
  models: AiModelOption[];
  defaultModel: string;
  keyHint: string;
};

export const PROVIDERS: ProviderMeta[] = [
  {
    value: "gemini",
    label: "Google Gemini (free tier)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: [
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash — recommended, fast & capable" },
      { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite — lighter, higher rate limit" },
      { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (preview)" },
    ],
    defaultModel: "gemini-3.5-flash",
    keyHint: "Create a free key at aistudio.google.com → Get API key",
  },
  {
    value: "groq",
    label: "Groq (free tier)",
    baseUrl: "https://api.groq.com/openai/v1",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile — best quality (1,000 req/day)" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant — fastest, most generous limit (14,400 req/day)" },
      { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout — longest context (30k TPM)" },
    ],
    defaultModel: "llama-3.3-70b-versatile",
    keyHint: "Create a free key at console.groq.com",
  },
  {
    value: "openrouter",
    label: "OpenRouter (free models)",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      { id: "openrouter/free", label: "Auto-router (free) — picks a working free model for you, recommended" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B Instruct (free)" },
    ],
    defaultModel: "openrouter/free",
    keyHint: "Create a key at openrouter.ai/keys — the free lineup rotates, check openrouter.ai/models?q=free for the current list",
  },
  {
    value: "custom",
    label: "Custom (any OpenAI-compatible URL)",
    baseUrl: "",
    models: [],
    defaultModel: "",
    keyHint: "Point at any OpenAI-compatible endpoint (Ollama, vLLM, paid APIs…)",
  },
  {
    value: "mock",
    label: "Mock (no key needed)",
    baseUrl: "",
    models: [],
    defaultModel: "mock",
    keyHint: "Built-in stub responses until you plug in a real provider",
  },
];

export function providerMeta(provider: AiProvider): ProviderMeta {
  return PROVIDERS.find((p) => p.value === provider) ?? PROVIDERS[0];
}
