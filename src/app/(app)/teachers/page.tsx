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
  Th,
} from "@/components/ui";
import { createTeacherAction, toggleTeacherActiveAction } from "./actions";

export default async function TeachersPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from("teachers")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <>
      <PageHeader
        title="Teachers"
        description="The roster you assign to course weeks. Deactivate anyone who shouldn't appear in the assignment dropdowns."
      />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add teacher</h2>
        <form action={createTeacherAction} className="grid gap-4 sm:grid-cols-3">
          <Field label="Name" name="name" required>
            <Input id="name" name="name" required />
          </Field>
          <Field label="Code" name="code">
            <Input id="code" name="code" placeholder="e.g. SJ" />
          </Field>
          <Field label="Specializations" name="specializations">
            <Input id="specializations" name="specializations" />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit">Add teacher</Button>
          </div>
        </form>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Code</Th>
            <Th>Specializations</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {teachers?.map((t) => (
            <tr key={t.id} className={t.active ? "" : "opacity-60"}>
              <Td className="font-medium">{t.name}</Td>
              <Td>{t.code ?? "—"}</Td>
              <Td>{t.specializations ?? "—"}</Td>
              <Td>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.active
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {t.active ? "Active" : "Inactive"}
                </span>
              </Td>
              <Td>
                <form action={toggleTeacherActiveAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="active" value={String(t.active)} />
                  <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">
                    {t.active ? "Deactivate" : "Reactivate"}
                  </Button>
                </form>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!teachers?.length && <EmptyState>No teachers yet.</EmptyState>}
    </>
  );
}
