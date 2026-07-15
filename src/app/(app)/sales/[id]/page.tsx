import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { findEmailUrl, orgTypeLabel, SALES_STAGES, stageBadgeClass, stageLabel } from "@/lib/sales";
import { channelLabel } from "@/lib/planner";
import { DraftPanel } from "./draft-panel";
import { AiPanel } from "@/components/ai-panel";
import { addActivityAction, askLeadAiAction, markContactedAction, updateLeadAction } from "../actions";

const KIND_LABEL: Record<string, string> = {
  note: "Note",
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  stage: "Stage change",
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase.from("sales_leads").select("*").eq("id", id).single();
  if (!lead) notFound();

  const [{ data: activities }, { data: weeks }] = await Promise.all([
    supabase
      .from("sales_activities")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("course_weeks").select("location"),
  ]);

  const destinations = [
    ...new Set(
      (weeks ?? [])
        .map((w) => w.location)
        .filter((l): l is string => !!l && l.toLowerCase() !== "iceland")
    ),
  ];

  return (
    <>
      <Link href={`/sales?ch=${lead.channel}`} className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        &larr; Back to sales
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title={lead.name}
          description={`${orgTypeLabel(lead.org_type)}${lead.municipality ? ` · ${lead.municipality}` : ""} · ${channelLabel(
            lead.channel
          )}`}
        />
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${stageBadgeClass(lead.stage)}`}
        >
          {stageLabel(lead.stage)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form action={markContactedAction}>
          <input type="hidden" name="lead_id" value={lead.id} />
          <Button type="submit">Mark contacted today</Button>
        </form>
        {lead.stage !== "lost" && (
          <Link
            href={{
              pathname: "/weeks/new",
              query: {
                from_lead: lead.id,
                lead_name: lead.name,
                channel: lead.channel,
                label: lead.name,
                notes: `From sales lead: ${lead.name}${lead.municipality ? ` (${lead.municipality})` : ""}${
                  lead.contact_person ? ` · contact ${lead.contact_person}` : ""
                }`,
              },
            }}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Convert to course week →
          </Link>
        )}
        {!lead.email && (
          <a
            href={findEmailUrl(lead.name, lead.municipality)}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
          >
            Find email ↗
          </a>
        )}
        {lead.website && (
          <a
            href={lead.website}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
          >
            Website ↗
          </a>
        )}
        {lead.last_contacted_at && (
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Last contacted {new Date(lead.last_contacted_at).toLocaleDateString("en-GB")}
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Details</h2>
          <form action={updateLeadAction} className="space-y-3">
            <input type="hidden" name="lead_id" value={lead.id} />
            <Field label="Email" name="email">
              <Input name="email" type="email" defaultValue={lead.email ?? ""} placeholder="school@example.is" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" name="phone">
                <Input name="phone" defaultValue={lead.phone ?? ""} />
              </Field>
              <Field label="Contact person" name="contact_person">
                <Input name="contact_person" defaultValue={lead.contact_person ?? ""} />
              </Field>
            </div>
            <Field label="Website" name="website">
              <Input name="website" defaultValue={lead.website ?? ""} placeholder="https://…" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stage" name="stage">
                <Select name="stage" defaultValue={lead.stage}>
                  {SALES_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Follow up on" name="next_follow_up_at">
                <Input name="next_follow_up_at" type="date" defaultValue={lead.next_follow_up_at ?? ""} />
              </Field>
            </div>
            <Field label="Notes" name="notes">
              <Textarea name="notes" defaultValue={lead.notes ?? ""} rows={3} />
            </Field>
            <Button type="submit" variant="ghost" className="text-xs">
              Save details
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Outreach draft
          </h2>
          <DraftPanel
            name={lead.name}
            orgType={lead.org_type}
            email={lead.email}
            destinations={destinations}
          />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          ✨ AI next move
        </h2>
        <AiPanel
          action={askLeadAiAction.bind(null, lead.id)}
          buttonLabel="Suggest next move"
          placeholder="Optional: ask something about this lead…"
          intro="Looks at this lead's stage and contact history (organisation-level only) and suggests what to do next."
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Activity log</h2>
        <form action={addActivityAction} className="mb-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="lead_id" value={lead.id} />
          <div className="w-32">
            <Select name="kind" defaultValue="note" aria-label="Activity type">
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
            </Select>
          </div>
          <div className="min-w-[200px] flex-1">
            <Input name="body" placeholder="Log a call, note or next step…" aria-label="Activity" />
          </div>
          <Button type="submit" variant="ghost" className="text-xs">
            Add
          </Button>
        </form>

        {activities?.length ? (
          <ul className="space-y-2">
            {activities.map((a) => (
              <li
                key={a.id}
                className="flex gap-3 border-l-2 border-neutral-200 pl-3 text-sm dark:border-neutral-800"
              >
                <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {KIND_LABEL[a.kind] ?? a.kind}
                </span>
                <div>
                  <p className="text-neutral-700 dark:text-neutral-300">{a.body}</p>
                  <p className="text-xs text-neutral-400">
                    {new Date(a.created_at).toLocaleString("en-GB")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No activity yet. Log your first call or email above.</EmptyState>
        )}
      </Card>
    </>
  );
}
