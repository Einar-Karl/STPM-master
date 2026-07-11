import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, EmptyState, PageHeader, Select, Table, Td, Th } from "@/components/ui";
import { approveStaffAction, updateStaffRoleAction } from "./actions";

export default async function StaffPage() {
  const { profile: currentProfile } = await requireAdmin();
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const pending = (staff ?? []).filter((p) => p.role === "pending");
  const approved = (staff ?? []).filter((p) => p.role !== "pending");

  return (
    <>
      <PageHeader title="Staff" description="Manage staff accounts, roles, and signup requests." />

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Adding new staff
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Staff can request access themselves at <span className="font-medium">/signup</span> — new
          accounts land in the pending queue below until an admin approves them. You can also invite
          someone directly from the Supabase dashboard (Authentication &rarr; Users &rarr; Invite
          user); they&apos;ll show up here pending too.
        </p>
      </Card>

      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Pending approval {pending.length > 0 && `(${pending.length})`}
      </h2>
      {pending.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Requested</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {pending.map((person) => (
              <tr key={person.id}>
                <Td className="font-medium">{person.full_name}</Td>
                <Td>{person.email}</Td>
                <Td>{new Date(person.created_at).toLocaleDateString()}</Td>
                <Td>
                  <form action={approveStaffAction}>
                    <input type="hidden" name="id" value={person.id} />
                    <Button type="submit" className="px-2 py-1 text-xs">
                      Approve
                    </Button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Card>
          <EmptyState>No pending signup requests.</EmptyState>
        </Card>
      )}

      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Team</h2>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
          </tr>
        </thead>
        <tbody>
          {approved.map((person) => (
            <tr key={person.id}>
              <Td className="font-medium">{person.full_name}</Td>
              <Td>{person.email}</Td>
              <Td>
                {person.id === currentProfile.id ? (
                  <span className="capitalize">{person.role} (you)</span>
                ) : (
                  <form action={updateStaffRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={person.id} />
                    <Select name="role" defaultValue={person.role} className="py-1 text-xs">
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      <option value="pending">Pending (revoke access)</option>
                    </Select>
                    <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">
                      Set
                    </Button>
                  </form>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
