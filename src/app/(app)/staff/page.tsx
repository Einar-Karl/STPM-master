import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, PageHeader, Select, Table, Td, Th } from "@/components/ui";
import { updateStaffRoleAction } from "./actions";

export default async function StaffPage() {
  const { profile: currentProfile } = await requireAdmin();
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHeader title="Staff" description="Manage staff accounts and roles." />

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Adding new staff
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Invite new staff from the Supabase dashboard: Authentication &rarr; Users &rarr; Invite user.
          They&apos;ll get an email to set their password, and an account row appears below automatically
          with the <span className="font-medium">staff</span> role. Promote them to{" "}
          <span className="font-medium">admin</span> here if needed.
        </p>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
          </tr>
        </thead>
        <tbody>
          {staff?.map((person) => (
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
