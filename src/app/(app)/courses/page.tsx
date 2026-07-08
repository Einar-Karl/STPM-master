import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { createCourseAction, deleteCourseAction } from "./actions";

export default async function CoursesPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Courses" description="STPM's course catalog. Open a course to schedule sessions." />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add course</h2>
        <form action={createCourseAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required>
            <Input id="name" name="name" required />
          </Field>
          <Field label="Duration (days)" name="duration_days">
            <Input id="duration_days" name="duration_days" type="number" min={1} />
          </Field>
          <Field label="Price" name="price">
            <Input id="price" name="price" type="number" min={0} step="0.01" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" name="description">
              <Textarea id="description" name="description" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add course</Button>
          </div>
        </form>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Duration</Th>
            <Th>Price</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {courses?.map((course) => (
            <tr key={course.id}>
              <Td className="font-medium">
                <Link href={`/courses/${course.id}`} className="hover:underline">
                  {course.name}
                </Link>
              </Td>
              <Td>{course.duration_days ? `${course.duration_days} days` : "—"}</Td>
              <Td>{course.price != null ? course.price : "—"}</Td>
              <Td>
                <div className="flex gap-2">
                  <Link href={`/courses/${course.id}`}>
                    <Button variant="ghost" className="px-2 py-1 text-xs">
                      Sessions
                    </Button>
                  </Link>
                  <form action={deleteCourseAction}>
                    <input type="hidden" name="id" value={course.id} />
                    <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                      Delete
                    </Button>
                  </form>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!courses?.length && <EmptyState>No courses yet.</EmptyState>}
    </>
  );
}
