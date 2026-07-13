import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { Button, Card, ErrorBanner, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { CHANNELS } from "@/lib/planner";
import { createCourseWeekAction } from "../actions";

const ERRORS: Record<string, string> = {
  missing: "Please fill in the start date, end date and location.",
  dates: "The end date must be on or after the start date.",
  "23505": "A course week already exists for that date, location and channel.",
};

export default async function NewWeekPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    channel?: string;
    location?: string;
    label?: string;
    notes?: string;
    from_lead?: string;
    lead_name?: string;
  }>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const channel = sp.channel === "innie" || sp.channel === "outie" ? sp.channel : "outie";

  return (
    <>
      <Link href="/weeks" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        &larr; Back to course weeks
      </Link>
      <PageHeader
        title="New course week"
        description="Create a week, then add the courses running in it. A day-by-day plan is generated automatically."
      />

      {sp.from_lead && sp.lead_name && (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300">
          Converting sales lead <span className="font-semibold">{sp.lead_name}</span> into a course week. When
          you save, the lead is marked <span className="font-semibold">Won</span> and the conversion is logged.
        </p>
      )}

      {sp.error && (
        <ErrorBanner message={ERRORS[sp.error] ?? "Could not create the week. Please try again."} />
      )}

      <Card>
        <form action={createCourseWeekAction} className="grid gap-4 sm:grid-cols-2">
          {sp.from_lead && <input type="hidden" name="from_lead" value={sp.from_lead} />}
          <Field label="Channel" name="channel" required>
            <Select id="channel" name="channel" defaultValue={channel}>
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} — {c.blurb}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Location" name="location" required>
            <Input
              id="location"
              name="location"
              required
              defaultValue={sp.location ?? ""}
              placeholder="e.g. Iceland, Spain, Gdansk"
            />
          </Field>
          <Field label="Start date" name="start_date" required>
            <Input id="start_date" name="start_date" type="date" required />
          </Field>
          <Field label="End date" name="end_date" required>
            <Input id="end_date" name="end_date" type="date" required />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Label (optional)" name="label">
              <Input
                id="label"
                name="label"
                defaultValue={sp.label ?? ""}
                placeholder="Defaults to “Location · dates”"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes (optional)" name="notes">
              <Textarea id="notes" name="notes" rows={2} defaultValue={sp.notes ?? ""} />
            </Field>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit">Create week</Button>
            <Link
              href="/weeks"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </>
  );
}
