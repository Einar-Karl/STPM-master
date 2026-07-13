import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { channelLabel, formatDateRange, paymentBadgeClass } from "@/lib/planner";
import { SessionSchedule } from "./session-schedule";

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
  const activeView = view === "schedule" ? "schedule" : "roster";
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("course_sessions")
    .select(
      "id, week_id, courses(name), course_weeks(start_date, end_date, location, channel), lead:lead_teacher_id(name), support:support_teacher_id(name)"
    )
    .eq("id", id)
    .single();
  if (!session) notFound();

  const [{ data: participants }, { data: sessionDays }] = await Promise.all([
    supabase
      .from("course_bookings")
      .select(
        "id, participant_name, nationality, school, coordinator, payment_status, tour_booked, status, group_label"
      )
      .eq("session_id", id)
      .order("participant_name", { ascending: true }),
    supabase
      .from("course_session_days")
      .select("id, day_date, title, notes")
      .eq("session_id", id)
      .order("day_date", { ascending: true }),
  ]);

  const course = (session.courses as unknown as { name: string } | null)?.name ?? "Course";
  const week = session.course_weeks as unknown as {
    start_date: string;
    end_date: string;
    location: string;
    channel: "innie" | "outie";
  } | null;
  const lead = (session.lead as unknown as { name: string } | null)?.name;
  const support = (session.support as unknown as { name: string } | null)?.name;

  const active = (participants ?? []).filter((p) => p.status !== "cancelled");

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

      <div className="flex gap-2">
        {(
          [
            { key: "roster", label: "Roster" },
            { key: "schedule", label: "Daily schedule" },
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
        participants?.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Participant</Th>
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
                <tr key={p.id}>
                  <Td className="font-medium">{p.participant_name}</Td>
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
        )
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
        />
      ) : (
        <Card>
          <EmptyState>No schedule days yet for this course.</EmptyState>
        </Card>
      )}
    </>
  );
}
