import { requireAdmin } from "@/lib/auth";
import { Button, Card, ErrorBanner, PageHeader } from "@/components/ui";
import { getAiConfig, PROVIDERS } from "@/lib/ai";
import { saveAiSettingsAction, testAiAction } from "./actions";
import { AiSettingsForm } from "./settings-form";

export default async function AiSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; test?: string; msg?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const config = await getAiConfig();

  return (
    <>
      <PageHeader
        title="AI Settings"
        description="The sales assistant and STPM chatbot run through whichever provider is configured here — switchable at any time."
      />

      {sp.saved && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Settings saved.
        </p>
      )}
      {sp.test === "ok" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Connection works — the model replied: “{sp.msg}”
        </p>
      )}
      {sp.test === "fail" && <ErrorBanner message={`Connection failed: ${sp.msg}`} />}

      <Card>
        <AiSettingsForm
          action={saveAiSettingsAction}
          initialProvider={config.provider}
          initialModel={config.model}
          initialBaseUrl={config.baseUrl}
          hasStoredKey={!!config.apiKey}
          enabled={config.enabled}
        />
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Test the connection</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Sends one tiny prompt with the saved settings and shows the reply.
            </p>
          </div>
          <form action={testAiAction}>
            <Button type="submit" variant="ghost">
              Run test
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Getting a free key</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
          {PROVIDERS.filter((p) => p.keyHint && p.value !== "mock").map((p) => (
            <li key={p.value}>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">{p.label}:</span> {p.keyHint}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          Privacy: the assistants only ever send aggregated statistics and organisation-level
          information to the provider — never participant names, emails or phone numbers. Free tiers
          may use inputs for training, and the saved key is readable by signed-in staff; use the{" "}
          <code>AI_API_KEY</code> environment variable instead if you want it out of the database.
        </p>
      </Card>
    </>
  );
}
