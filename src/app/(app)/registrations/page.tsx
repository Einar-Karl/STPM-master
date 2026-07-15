import Link from "next/link";
import { headers } from "next/headers";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { formatDateRange } from "@/lib/planner";

const STATUS_STYLE: Record<string, string> = {
  imported: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  duplicate: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  unmatched: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  invalid: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function RegistrationsPage() {
  await requireStaff();
  const supabase = await createClient();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "your-app.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const webhookUrl = `${proto}://${host}/api/webhooks/kajabi`;

  const [{ data: events }, { data: keyed }] = await Promise.all([
    supabase
      .from("registration_events")
      .select("id, created_at, participant_name, email, registration_key, status, detail, course_sessions(courses(name))")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("course_sessions")
      .select("id, registration_key, courses(name), course_weeks(start_date, end_date, location)")
      .not("registration_key", "is", null)
      .order("start_date", { ascending: true }),
  ]);

  const courseName = (row: { course_sessions?: unknown }) =>
    ((row.course_sessions as { courses?: { name?: string } } | null)?.courses?.name) ?? null;

  return (
    <>
      <PageHeader
        title="Registrations"
        description="Let the website (Kajabi) drop new sign-ups straight onto a course roster — no Google Sheet, no re-typing."
      />

      {/* How it works */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Connect Kajabi in three steps
        </h2>
        <ol className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
          <li>
            <span className="font-medium">1. Tag each course with a key.</span> Open a course and set its{" "}
            <span className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
              Website registration key
            </span>{" "}
            (e.g. <code>ai-education-jul12</code>). Use the same value in the matching Kajabi offer/form.
          </li>
          <li>
            <span className="font-medium">2. Point Kajabi at this address.</span> In Kajabi (Automations →
            &ldquo;New registration&rdquo; → run a webhook), or via Zapier/Make, POST the form fields as JSON to:
            <code className="mt-1 block overflow-x-auto rounded-md bg-neutral-900 px-3 py-2 text-xs text-neutral-100 dark:bg-neutral-950">
              {webhookUrl}?token=YOUR_SECRET
            </code>
            Send fields named like <code>name</code>, <code>email</code>, <code>nationality</code>,{" "}
            <code>school</code>, <code>tour</code> and a <code>course</code> key — the names are matched loosely,
            in English or Icelandic.
          </li>
          <li>
            <span className="font-medium">3. Set two secrets in hosting.</span>{" "}
            <code className="text-xs">STPM_WEBHOOK_SECRET</code> (any long random string — the{" "}
            <code>YOUR_SECRET</code> above) and <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>. Until
            both are set the endpoint stays safely disabled.
          </li>
        </ol>
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          Kajabi keeps sending its own emails (thank-you, info, pre-arrival). This just makes sure every
          registration also becomes a roster entry here, instantly — with duplicates skipped.
        </p>
      </Card>

      {/* Courses that are wired up */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Courses accepting online registrations
        </h2>
        {keyed?.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Course</Th>
                <Th>Week</Th>
                <Th>Registration key</Th>
              </tr>
            </thead>
            <tbody>
              {keyed.map((s) => {
                const week = s.course_weeks as unknown as {
                  start_date: string;
                  end_date: string;
                  location: string;
                } | null;
                return (
                  <tr key={s.id}>
                    <Td className="font-medium">
                      <Link href={`/sessions/${s.id}`} className="hover:underline">
                        {(s.courses as unknown as { name: string } | null)?.name ?? "—"}
                      </Link>
                    </Td>
                    <Td>
                      {week ? `${formatDateRange(week.start_date, week.end_date)} · ${week.location}` : "—"}
                    </Td>
                    <Td>
                      <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">
                        {s.registration_key}
                      </code>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState>
            No course has a registration key yet. Open a course&apos;s roster and set one to start accepting
            online sign-ups.
          </EmptyState>
        )}
      </Card>

      {/* Live inbound feed */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Recent registrations
        </h2>
        {events?.length ? (
          <Table>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Name</Th>
                <Th>Course</Th>
                <Th>Key</Th>
                <Th>Result</Th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <Td className="whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(e.created_at).toLocaleString("en-GB")}
                  </Td>
                  <Td className="font-medium">
                    {e.participant_name ?? e.email ?? "—"}
                    {e.detail && (
                      <span className="block text-xs font-normal text-neutral-400">{e.detail}</span>
                    )}
                  </Td>
                  <Td>{courseName(e) ?? "—"}</Td>
                  <Td>
                    {e.registration_key ? (
                      <code className="text-xs text-neutral-500">{e.registration_key}</code>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLE[e.status] ?? STATUS_STYLE.duplicate
                      }`}
                    >
                      {e.status}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>
            No registrations have arrived yet. Once Kajabi is wired up, every sign-up shows here — including any
            that couldn&apos;t be matched to a course, so nothing gets lost.
          </EmptyState>
        )}
      </Card>
    </>
  );
}
