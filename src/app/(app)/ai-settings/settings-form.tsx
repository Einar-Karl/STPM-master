"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { PROVIDERS, type AiProvider } from "@/lib/ai-providers";

const KNOWN_DEFAULTS = new Set(PROVIDERS.map((p) => p.defaultModel).filter(Boolean));

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
  const [model, setModel] = useState(initialModel);

  function onProviderChange(next: AiProvider) {
    setProvider(next);
    // Only auto-fill the model when it's empty or still holds another
    // provider's default — never clobber a value someone typed on purpose.
    setModel((current) => {
      if (!current.trim() || KNOWN_DEFAULTS.has(current)) {
        return PROVIDERS.find((p) => p.value === next)?.defaultModel ?? current;
      }
      return current;
    });
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
        <Field label="Model" name="model">
          <Input
            name="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gemini-3.5-flash"
          />
        </Field>
        <Field label="Base URL (custom provider only)" name="base_url">
          <Input name="base_url" defaultValue={provider === "custom" ? initialBaseUrl : ""} placeholder="https://…/v1" />
        </Field>
      </div>

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
