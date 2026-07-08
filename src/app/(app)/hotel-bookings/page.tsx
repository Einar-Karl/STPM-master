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
  createHotelBookingAction,
  deleteHotelBookingAction,
  updateHotelBookingStatusAction,
} from "./actions";

const STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;

export default async function HotelBookingsPage() {
  await requireStaff();
  const supabase = await createClient();

  const [{ data: bookings }, { data: hotels }, { data: rooms }, { data: clients }, { data: sessions }] =
    await Promise.all([
      supabase
        .from("hotel_bookings")
        .select("*, hotels(name), hotel_rooms(name), clients(name)")
        .order("check_in", { ascending: true }),
      supabase.from("hotels").select("id, name").order("name", { ascending: true }),
      supabase.from("hotel_rooms").select("id, name, hotel_id, hotels(name)").order("name", { ascending: true }),
      supabase.from("clients").select("id, name").order("name", { ascending: true }),
      supabase
        .from("course_sessions")
        .select("id, start_date, end_date, courses(name)")
        .order("start_date", { ascending: true }),
    ]);

  return (
    <>
      <PageHeader title="Hotel Bookings" description="Accommodation booked for clients and groups." />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add hotel booking</h2>
        <form action={createHotelBookingAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Hotel" name="hotel_id" required>
            <Select id="hotel_id" name="hotel_id" required defaultValue="">
              <option value="" disabled>
                Select a hotel
              </option>
              {hotels?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Room (optional)" name="room_id">
            <Select id="room_id" name="room_id" defaultValue="">
              <option value="">Unassigned</option>
              {rooms?.map((r) => (
                <option key={r.id} value={r.id}>
                  {(r.hotels as unknown as { name: string } | null)?.name} &middot; {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Guest / group name" name="guest_name" required>
            <Input id="guest_name" name="guest_name" required />
          </Field>
          <Field label="Guests" name="guests">
            <Input id="guests" name="guests" type="number" min={1} defaultValue={1} />
          </Field>
          <Field label="Check-in" name="check_in" required>
            <Input id="check_in" name="check_in" type="date" required />
          </Field>
          <Field label="Check-out" name="check_out" required>
            <Input id="check_out" name="check_out" type="date" required />
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
            <Th>Guest</Th>
            <Th>Hotel / room</Th>
            <Th>Dates</Th>
            <Th>Client</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {bookings?.map((booking) => {
            const hotel = booking.hotels as unknown as { name: string } | null;
            const room = booking.hotel_rooms as unknown as { name: string } | null;
            const client = booking.clients as unknown as { name: string } | null;
            return (
              <tr key={booking.id}>
                <Td className="font-medium">
                  {booking.guest_name}
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                    {booking.guests} guest{booking.guests === 1 ? "" : "s"}
                  </span>
                </Td>
                <Td>
                  {hotel?.name ?? "—"}
                  {room && (
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">{room.name}</span>
                  )}
                </Td>
                <Td>
                  {booking.check_in} &rarr; {booking.check_out}
                </Td>
                <Td>{client?.name ?? "—"}</Td>
                <Td>
                  <form action={updateHotelBookingStatusAction} className="flex items-center gap-2">
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
                  <form action={deleteHotelBookingAction}>
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
      {!bookings?.length && <EmptyState>No hotel bookings yet.</EmptyState>}
    </>
  );
}
