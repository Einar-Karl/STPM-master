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
import { createHotelAction, deleteHotelAction } from "./actions";

export default async function HotelsPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data: hotels } = await supabase
    .from("hotels")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Hotels" description="Hotels STPM works with for client and group accommodation." />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add hotel</h2>
        <form action={createHotelAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required>
            <Input id="name" name="name" required />
          </Field>
          <Field label="Contact info" name="contact_info">
            <Input id="contact_info" name="contact_info" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" name="address">
              <Input id="address" name="address" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes" name="notes">
              <Textarea id="notes" name="notes" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add hotel</Button>
          </div>
        </form>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Address</Th>
            <Th>Contact</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {hotels?.map((hotel) => (
            <tr key={hotel.id}>
              <Td className="font-medium">
                <Link href={`/hotels/${hotel.id}`} className="hover:underline">
                  {hotel.name}
                </Link>
              </Td>
              <Td>{hotel.address ?? "—"}</Td>
              <Td>{hotel.contact_info ?? "—"}</Td>
              <Td>
                <div className="flex gap-2">
                  <Link href={`/hotels/${hotel.id}`}>
                    <Button variant="ghost" className="px-2 py-1 text-xs">
                      Rooms
                    </Button>
                  </Link>
                  <form action={deleteHotelAction}>
                    <input type="hidden" name="id" value={hotel.id} />
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
      {!hotels?.length && <EmptyState>No hotels yet.</EmptyState>}
    </>
  );
}
