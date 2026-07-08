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
  Textarea,
  Th,
} from "@/components/ui";
import { createSessionAction, deleteSessionAction } from "./actions";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();
  if (!course) notFound();

  const { data: sessions } = await supabase
    .from("course_sessions")
    .select("*")
    .eq("course_id", id)
    .order("start_date", { ascending: true });

  return (
    <>
      <Link href="/courses" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        &larr; Back to courses
      </Link>
      <PageHeader title={course.name} description={course.description ?? undefined} />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Schedule a session</h2>
        <form action={createSessionAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="course_id" value={course.id} />
          <Field label="Location" name="location">
            <Input id="location" name="location" />
          </Field>
          <Field label="Capacity" name="capacity">
            <Input id="capacity" name="capacity" type="number" min={1} />
          </Field>
          <Field label="Start date" name="start_date" required>
            <Input id="start_date" name="start_date" type="date" required />
          </Field>
          <Field label="End date" name="end_date" required>
            <Input id="end_date" name="end_date" type="date" required />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes" name="notes">
              <Textarea id="notes" name="notes" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add session</Button>
          </div>
        </form>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Dates</Th>
            <Th>Location</Th>
            <Th>Capacity</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {sessions?.map((session) => (
            <tr key={session.id}>
              <Td className="font-medium">
                {session.start_date} &rarr; {session.end_date}
              </Td>
              <Td>{session.location ?? "—"}</Td>
              <Td>{session.capacity ?? "—"}</Td>
              <Td>
                <StatusBadge status={session.status} />
              </Td>
              <Td>
                <form action={deleteSessionAction}>
                  <input type="hidden" name="id" value={session.id} />
                  <input type="hidden" name="course_id" value={course.id} />
                  <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                    Delete
                  </Button>
                </form>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!sessions?.length && <EmptyState>No sessions scheduled yet.</EmptyState>}
    </>
  );
}
