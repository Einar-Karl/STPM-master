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
  Table,
  Td,
  Th,
} from "@/components/ui";
import { createRoomAction, deleteRoomAction } from "./actions";

export default async function HotelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const { data: hotel } = await supabase.from("hotels").select("*").eq("id", id).single();
  if (!hotel) notFound();

  const { data: rooms } = await supabase
    .from("hotel_rooms")
    .select("*")
    .eq("hotel_id", id)
    .order("name", { ascending: true });

  return (
    <>
      <Link href="/hotels" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        &larr; Back to hotels
      </Link>
      <PageHeader title={hotel.name} description={hotel.address ?? undefined} />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add room</h2>
        <form action={createRoomAction} className="grid gap-4 sm:grid-cols-3">
          <input type="hidden" name="hotel_id" value={hotel.id} />
          <Field label="Name / number" name="name" required>
            <Input id="name" name="name" required />
          </Field>
          <Field label="Room type" name="room_type">
            <Input id="room_type" name="room_type" placeholder="Single, double, suite..." />
          </Field>
          <Field label="Capacity" name="capacity">
            <Input id="capacity" name="capacity" type="number" min={1} defaultValue={1} />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit">Add room</Button>
          </div>
        </form>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Capacity</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {rooms?.map((room) => (
            <tr key={room.id}>
              <Td className="font-medium">{room.name}</Td>
              <Td>{room.room_type ?? "—"}</Td>
              <Td>{room.capacity}</Td>
              <Td>
                <form action={deleteRoomAction}>
                  <input type="hidden" name="id" value={room.id} />
                  <input type="hidden" name="hotel_id" value={hotel.id} />
                  <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                    Delete
                  </Button>
                </form>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!rooms?.length && <EmptyState>No rooms added yet.</EmptyState>}
    </>
  );
}
