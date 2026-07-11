import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui";

export default async function PendingApprovalPage() {
  const { profile } = await requireStaff();

  // Already approved — nothing to see here.
  if (profile.role !== "pending") redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Waiting for approval
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Hi {profile.full_name}, your account is signed in but hasn&apos;t been approved yet. An
          admin needs to approve you on the Staff page before you can see any data. Check back
          later, or ask an admin to approve <span className="font-medium">{profile.email}</span>.
        </p>
        <form action={logout}>
          <Button type="submit" variant="ghost" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
