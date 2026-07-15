"use client";

import { useMemo, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { PROVIDERS, providerMeta, type AiProvider } from "@/lib/ai-providers";

const CUSTOM_CHOICE = "__custom__";

function initialChoice(provider: AiProvider, model: string): string {
  const models = providerMeta(provider).models;
  return models.some((m) => m.id === model) ? model : CUSTOM_CHOICE;
}

export function AiSettingsForm({
  action,
  initialProvider,
  initialModel,
  initialBaseUrl,
  hasStoredKey,
  enabled,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initialProvider: AiProvider;
  initialModel: string;
  initialBaseUrl: string;
  hasStoredKey: boolean;
  enabled: boolean;
}) {
  const [provider, setProvider] = useState<AiProvider>(initialProvider);
  const [choice, setChoice] = useState<string>(() => initialChoice(initialProvider, initialModel));
  const [customModel, setCustomModel] = useState<string>(() =>
    initialChoice(initialProvider, initialModel) === CUSTOM_CHOICE ? initialModel : ""
  );

  const models = useMemo(() => providerMeta(provider).models, [provider]);
  const finalModel = choice === CUSTOM_CHOICE ? customModel : choice;

  function onProviderChange(next: AiProvider) {
    setProvider(next);
    const nextModels = providerMeta(next).models;
    if (nextModels.length === 0) {
      // Custom / mock: always free-text (mock's value doesn't matter).
      setChoice(CUSTOM_CHOICE);
      setCustomModel(next === "mock" ? "mock" : "");
    } else {
      // A model id is provider-specific, so switching providers always
      // resets to that provider's recommended default.
      setChoice(nextModels[0].id);
      setCustomModel("");
    }
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="Provider" name="provider">
        <Select name="provider" value={provider} onChange={(e) => onProviderChange(e.target.value as AiProvider)}>
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Model" name="model_choice">
          {models.length > 0 ? (
            <>
              <Select value={choice} onChange={(e) => setChoice(e.target.value)}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
                <option value={CUSTOM_CHOICE}>Other — type a model ID manually…</option>
              </Select>
              {choice === CUSTOM_CHOICE && (
                <Input
                  className="mt-2"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="Exact model ID from the provider's docs"
                  aria-label="Custom model ID"
                />
              )}
            </>
          ) : provider === "mock" ? (
            <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
              No model needed in mock mode.
            </p>
          ) : (
            <Input
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="e.g. llama3.1, gpt-4o-mini, mistral-large…"
            />
          )}
          <input type="hidden" name="model" value={finalModel} />
        </Field>
        <Field label="Base URL (custom provider only)" name="base_url">
          <Input name="base_url" defaultValue={provider === "custom" ? initialBaseUrl : ""} placeholder="https://…/v1" />
        </Field>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Free-tier model lineups change often — if a request 404s, pick a different one from the list
        or type the current model ID from the provider’s docs.
      </p>

      <Field label="API key" name="api_key">
        <Input
          name="api_key"
          type="password"
          autoComplete="off"
          placeholder={hasStoredKey ? "•••••••• (a key is saved — type to replace)" : "Paste the provider API key"}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <input type="checkbox" name="clear_key" /> Remove the saved key
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        <input type="checkbox" name="enabled" defaultChecked={enabled} /> AI features enabled
      </label>

      <Button type="submit">Save settings</Button>
    </form>
  );
}
