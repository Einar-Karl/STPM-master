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
import { createClientAction, deleteClientAction } from "./actions";

export default async function ClientsPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Individuals, companies, and groups that courses and hotel stays are booked for."
      />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add client</h2>
        <form action={createClientAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required>
            <Input id="name" name="name" required />
          </Field>
          <Field label="Type" name="type" required>
            <Select id="type" name="type" defaultValue="individual">
              <option value="individual">Individual</option>
              <option value="company">Company</option>
              <option value="group">Group</option>
            </Select>
          </Field>
          <Field label="Contact person" name="contact_person">
            <Input id="contact_person" name="contact_person" />
          </Field>
          <Field label="Email" name="email">
            <Input id="email" name="email" type="email" />
          </Field>
          <Field label="Phone" name="phone">
            <Input id="phone" name="phone" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes" name="notes">
              <Textarea id="notes" name="notes" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add client</Button>
          </div>
        </form>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Contact</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {clients?.map((client) => (
            <tr key={client.id}>
              <Td className="font-medium">{client.name}</Td>
              <Td className="capitalize">{client.type}</Td>
              <Td>{client.contact_person ?? "—"}</Td>
              <Td>{client.email ?? "—"}</Td>
              <Td>{client.phone ?? "—"}</Td>
              <Td>
                <form action={deleteClientAction}>
                  <input type="hidden" name="id" value={client.id} />
                  <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                    Delete
                  </Button>
                </form>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!clients?.length && <EmptyState>No clients yet.</EmptyState>}
    </>
  );
}
