// Client-safe provider metadata — no server-only imports here, so this can
// be pulled into client components (e.g. the AI Settings form) directly.

export type AiProvider = "gemini" | "groq" | "openrouter" | "custom" | "mock";

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
