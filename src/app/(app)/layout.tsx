import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { logout } from "@/app/login/actions";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/weeks", label: "Course Weeks" },
  { href: "/teachers", label: "Teachers" },
  { href: "/courses", label: "Courses" },
  { href: "/course-bookings", label: "Course Bookings" },
  { href: "/clients", label: "Clients" },
  { href: "/hotels", label: "Hotels" },
  { href: "/hotel-bookings", label: "Hotel Bookings" },
  { href: "/resources", label: "Resources" },
];

const adminNavItems = [{ href: "/staff", label: "Staff" }];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  if (profile.role === "pending") redirect("/pending-approval");
  const items = profile.role === "admin" ? [...navItems, ...adminNavItems] : navItems;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">STPM Master</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Booking &amp; planning</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
          <p className="truncate px-3 text-xs text-neutral-500 dark:text-neutral-400">
            {profile.full_name} &middot; {profile.role}
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {process.env.DISABLE_AUTH === "true" && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Auth is disabled (<code>DISABLE_AUTH=true</code>). Anyone with this URL can use the app with
              no sign-in. Remove that env var before this is used for real.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
