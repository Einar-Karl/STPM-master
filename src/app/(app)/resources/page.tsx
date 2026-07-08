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
  Select,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { createResourceAction, deleteResourceAction } from "./actions";

export default async function ResourcesPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Resources"
        description="Internal bookable resources: meeting rooms, vehicles, and equipment."
      />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add resource</h2>
        <form action={createResourceAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required>
            <Input id="name" name="name" required />
          </Field>
          <Field label="Type" name="type" required>
            <Select id="type" name="type" defaultValue="room">
              <option value="room">Room</option>
              <option value="equipment">Equipment</option>
              <option value="vehicle">Vehicle</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" name="description">
              <Textarea id="description" name="description" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add resource</Button>
          </div>
        </form>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Description</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {resources?.map((resource) => (
            <tr key={resource.id}>
              <Td className="font-medium">
                <Link href={`/resources/${resource.id}`} className="hover:underline">
                  {resource.name}
                </Link>
              </Td>
              <Td className="capitalize">{resource.type}</Td>
              <Td>{resource.description ?? "—"}</Td>
              <Td>
                <div className="flex gap-2">
                  <Link href={`/resources/${resource.id}`}>
                    <Button variant="ghost" className="px-2 py-1 text-xs">
                      Bookings
                    </Button>
                  </Link>
                  <form action={deleteResourceAction}>
                    <input type="hidden" name="id" value={resource.id} />
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
      {!resources?.length && <EmptyState>No resources yet.</EmptyState>}
    </>
  );
}
