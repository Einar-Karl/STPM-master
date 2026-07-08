import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import {
  createCourseBookingAction,
  deleteCourseBookingAction,
  updateCourseBookingStatusAction,
} from "./actions";

const STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;

export default async function CourseBookingsPage() {
  await requireStaff();
  const supabase = await createClient();

  const [{ data: bookings }, { data: sessions }, { data: clients }] = await Promise.all([
    supabase
      .from("course_bookings")
      .select("*, course_sessions(start_date, end_date, courses(name)), clients(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("course_sessions")
      .select("id, start_date, end_date, courses(name)")
      .order("start_date", { ascending: true }),
    supabase.from("clients").select("id, name").order("name", { ascending: true }),
  ]);

  return (
    <>
      <PageHeader title="Course Bookings" description="Participants and clients enrolled in scheduled course sessions." />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add booking</h2>
        <form action={createCourseBookingAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Course session" name="session_id" required>
            <Select id="session_id" name="session_id" required defaultValue="">
              <option value="" disabled>
                Select a session
              </option>
              {sessions?.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.courses as unknown as { name: string } | null)?.name} ({s.start_date} &rarr; {s.end_date})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Client (optional)" name="client_id">
            <Select id="client_id" name="client_id" defaultValue="">
              <option value="">No linked client</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Participant name" name="participant_name" required>
            <Input id="participant_name" name="participant_name" required />
          </Field>
          <Field label="Participant email" name="participant_email">
            <Input id="participant_email" name="participant_email" type="email" />
          </Field>
          <Field label="Seats" name="seats">
            <Input id="seats" name="seats" type="number" min={1} defaultValue={1} />
          </Field>
          <Field label="Status" name="status">
            <Select id="status" name="status" defaultValue="pending">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes" name="notes">
              <Textarea id="notes" name="notes" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add booking</Button>
          </div>
        </form>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Participant</Th>
            <Th>Course session</Th>
            <Th>Client</Th>
            <Th>Seats</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {bookings?.map((booking) => {
            const session = booking.course_sessions as unknown as {
              start_date: string;
              end_date: string;
              courses: { name: string } | null;
            } | null;
            const client = booking.clients as unknown as { name: string } | null;
            return (
              <tr key={booking.id}>
                <Td className="font-medium">
                  {booking.participant_name}
                  {booking.participant_email && (
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                      {booking.participant_email}
                    </span>
                  )}
                </Td>
                <Td>
                  {session?.courses?.name ?? "—"}
                  {session && (
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                      {session.start_date} &rarr; {session.end_date}
                    </span>
                  )}
                </Td>
                <Td>{client?.name ?? "—"}</Td>
                <Td>{booking.seats}</Td>
                <Td>
                  <form action={updateCourseBookingStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={booking.id} />
                    <Select name="status" defaultValue={booking.status} className="py-1 text-xs">
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">
                      Set
                    </Button>
                  </form>
                </Td>
                <Td>
                  <form action={deleteCourseBookingAction}>
                    <input type="hidden" name="id" value={booking.id} />
                    <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                      Delete
                    </Button>
                  </form>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {!bookings?.length && <EmptyState>No course bookings yet.</EmptyState>}
    </>
  );
}
