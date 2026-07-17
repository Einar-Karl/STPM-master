import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { channelLabel, formatDateRange, hasSpecialNeeds, paymentBadgeClass } from "@/lib/planner";
import { PrepChecklist } from "@/components/prep-checklist";
import { SessionSchedule } from "./session-schedule";
import { SheetImport } from "./sheet-import";
import { updateRegistrationKeyAction } from "./actions";

export default async function SessionRosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { view } = await searchParams;
  const activeView = view === "schedule" || view === "checklist" ? view : "roster";
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("course_sessions")
    .select(
      "id, week_id, registration_key, courses(name), course_weeks(start_date, end_date, location, channel, signup_sheet_url), lead:lead_teacher_id(name), support:support_teacher_id(name)"
    )
    .eq("id", id)
    .single();
  if (!session) notFound();

  const [{ data: participants }, { data: sessionDays }, { data: prepTasks }] = await Promise.all([
    supabase
      .from("course_bookings")
      .select(
        "id, participant_name, nationality, school, coordinator, payment_status, tour_booked, status, group_label, special_needs"
      )
      .eq("session_id", id)
      .order("participant_name", { ascending: true }),
    supabase
      .from("course_session_days")
      .select("id, day_date, title, notes, location")
      .eq("session_id", id)
      .order("day_date", { ascending: true }),
    supabase
      .from("prep_tasks")
      .select("id, label, done")
      .eq("session_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const course = (session.courses as unknown as { name: string } | null)?.name ?? "Course";
  const week = session.course_weeks as unknown as {
    start_date: string;
    end_date: string;
    location: string;
    channel: "innie" | "outie";
    signup_sheet_url: string | null;
  } | null;
  const lead = (session.lead as unknown as { name: string } | null)?.name;
  const support = (session.support as unknown as { name: string } | null)?.name;

  const active = (participants ?? []).filter((p) => p.status !== "cancelled");
  const flagged = active.filter((p) => hasSpecialNeeds(p.special_needs));

  return (
    <>
      {session.week_id && (
        <Link
          href={`/weeks/${session.week_id}`}
          className="text-sm text-neutral-500 hover:underline dark:text-neutral-400"
        >
          &larr; Back to week
        </Link>
      )}
      <PageHeader
        title={course}
        description={
          week
            ? `${formatDateRange(week.start_date, week.end_date)} · ${week.location} · ${channelLabel(week.channel)}`
            : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Participants</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{active.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Lead teacher</p>
          <p className="mt-1 text-lg font-medium text-neutral-900 dark:text-neutral-100">{lead ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Support teacher</p>
          <p className="mt-1 text-lg font-medium text-neutral-900 dark:text-neutral-100">{support ?? "—"}</p>
        </Card>
      </div>

      {flagged.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
          <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            ⚠ {flagged.length} participant{flagged.length > 1 ? "s" : ""} with allergies, accessibility or other special needs
          </h2>
          <ul className="mt-2 space-y-1.5">
            {flagged.map((p) => (
              <li key={p.id} className="text-sm text-amber-900 dark:text-amber-200">
                <span className="font-semibold">{p.participant_name}:</span>{" "}
                <span className="text-amber-800 dark:text-amber-300">{p.special_needs}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
            Check venue access (wheelchair), meals and activities against this list before the week starts.
          </p>
        </Card>
      )}

      <div className="flex gap-2">
        {(
          [
            { key: "roster", label: "Roster" },
            { key: "schedule", label: "Daily schedule" },
            {
              key: "checklist",
              label: prepTasks?.length
                ? `Prep checklist (${prepTasks.filter((t) => t.done).length}/${prepTasks.length})`
                : "Prep checklist",
            },
          ] as const
        ).map((t) => (
          <Link
            key={t.key}
            href={`/sessions/${id}?view=${t.key}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeView === t.key
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeView === "roster" ? (
        <div className="space-y-4">
          <SheetImport sessionId={id} defaultUrl={week?.signup_sheet_url ?? null} />
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-[16rem] flex-1">
                <Field label="Website registration key" name="registration_key">
                  <form action={updateRegistrationKeyAction} className="flex gap-2">
                    <input type="hidden" name="session_id" value={id} />
                    <Input
                      name="registration_key"
                      defaultValue={session.registration_key ?? ""}
                      placeholder="e.g. ai-education-jul12"
                    />
                    <Button type="submit" variant="ghost">
                      Save
                    </Button>
                  </form>
                </Field>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Registrations from Kajabi that carry this key land on this roster automatically. See{" "}
                  <Link href="/registrations" className="underline">
                    Registrations
                  </Link>{" "}
                  for the setup.
                </p>
              </div>
            </div>
          </Card>
          {participants?.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Participant</Th>
                <Th>Needs</Th>
                <Th>Nationality</Th>
                <Th>School</Th>
                <Th>Coordinator</Th>
                <Th>Payment</Th>
                <Th>Tour</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className={hasSpecialNeeds(p.special_needs) ? "bg-amber-50 dark:bg-amber-950/30" : ""}>
                  <Td className="font-medium">{p.participant_name}</Td>
                  <Td>
                    {hasSpecialNeeds(p.special_needs) ? (
                      <span
                        title={p.special_needs ?? ""}
                        className="inline-block max-w-40 truncate rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      >
                        ⚠ {p.special_needs}
                      </span>
                    ) : (
                      <span className="text-neutral-300 dark:text-neutral-600">—</span>
                    )}
                  </Td>
                  <Td>{p.nationality ?? "—"}</Td>
                  <Td className="max-w-xs truncate">{p.school ?? "—"}</Td>
                  <Td>{p.coordinator ?? "—"}</Td>
                  <Td>
                    {p.payment_status ? (
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${paymentBadgeClass(
                          p.payment_status
                        )}`}
                      >
                        {p.payment_status}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>{p.tour_booked === true ? "Yes" : p.tour_booked === false ? "No" : "—"}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          ) : (
            <Card>
              <EmptyState>No participants booked on this course yet.</EmptyState>
            </Card>
          )}
        </div>
      ) : activeView === "checklist" ? (
        <PrepChecklist
          role="teacher"
          sessionId={id}
          title="Teacher prep checklist"
          intro="Your action plan for this course: work through it in the weeks before the seminar so nothing is left to the last minute. The planner has their own week-level checklist."
          tasks={prepTasks ?? []}
        />
      ) : sessionDays?.length ? (
        <SessionSchedule
          sessionId={id}
          courseName={course}
          meta={
            week
              ? `${formatDateRange(week.start_date, week.end_date)} · ${week.location} · ${
                  lead ? `Led by ${lead}` : "Lead unassigned"
                } · ${active.length} participants`
              : `${active.length} participants`
          }
          days={sessionDays}
          weekLocation={week?.location ?? null}
        />
      ) : (
        <Card>
          <EmptyState>No schedule days yet for this course.</EmptyState>
        </Card>
      )}
    </>
  );
}
