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
  Select,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { createResourceBookingAction, deleteResourceBookingAction } from "./actions";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const { data: resource } = await supabase.from("resources").select("*").eq("id", id).single();
  if (!resource) notFound();

  const [{ data: bookings }, { data: sessions }] = await Promise.all([
    supabase
      .from("resource_bookings")
      .select("*, course_sessions(courses(name))")
      .eq("resource_id", id)
      .order("start_at", { ascending: true }),
    supabase
      .from("course_sessions")
      .select("id, start_date, end_date, courses(name)")
      .order("start_date", { ascending: true }),
  ]);

  return (
    <>
      <Link href="/resources" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        &larr; Back to resources
      </Link>
      <PageHeader title={resource.name} description={resource.description ?? undefined} />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add booking</h2>
        <form action={createResourceBookingAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="resource_id" value={resource.id} />
          <Field label="Title" name="title" required>
            <Input id="title" name="title" required />
          </Field>
          <Field label="Linked course session (optional)" name="course_session_id">
            <Select id="course_session_id" name="course_session_id" defaultValue="">
              <option value="">None</option>
              {sessions?.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.courses as unknown as { name: string } | null)?.name} ({s.start_date} &rarr; {s.end_date})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start" name="start_at" required>
            <Input id="start_at" name="start_at" type="datetime-local" required />
          </Field>
          <Field label="End" name="end_at" required>
            <Input id="end_at" name="end_at" type="datetime-local" required />
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
            <Th>Title</Th>
            <Th>When</Th>
            <Th>Linked session</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {bookings?.map((booking) => {
            const session = booking.course_sessions as unknown as { courses: { name: string } | null } | null;
            return (
              <tr key={booking.id}>
                <Td className="font-medium">{booking.title}</Td>
                <Td>
                  {new Date(booking.start_at).toLocaleString()} &rarr; {new Date(booking.end_at).toLocaleString()}
                </Td>
                <Td>{session?.courses?.name ?? "—"}</Td>
                <Td>
                  <form action={deleteResourceBookingAction}>
                    <input type="hidden" name="id" value={booking.id} />
                    <input type="hidden" name="resource_id" value={resource.id} />
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
      {!bookings?.length && <EmptyState>No bookings for this resource yet.</EmptyState>}
    </>
  );
}
