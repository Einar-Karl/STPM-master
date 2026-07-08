import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default async function DashboardPage() {
  await requireStaff();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [clients, courses, sessions, hotelBookings, pendingBookings] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase
      .from("course_sessions")
      .select("id, location, start_date, end_date, status, courses(name)")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(5),
    supabase
      .from("hotel_bookings")
      .select("id, guest_name, check_in, check_out, status, hotels(name)")
      .gte("check_in", today)
      .order("check_in", { ascending: true })
      .limit(5),
    supabase.from("course_bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const stats = [
    { label: "Clients", value: clients.count ?? 0, href: "/clients" },
    { label: "Courses", value: courses.count ?? 0, href: "/courses" },
    { label: "Pending course bookings", value: pendingBookings.count ?? 0, href: "/course-bookings" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of STPM's upcoming courses and hotel bookings." />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-neutral-400 dark:hover:border-neutral-600">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{stat.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Upcoming course sessions
          </h2>
          {sessions.data?.length ? (
            <ul className="space-y-3">
              {sessions.data.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {(s.courses as unknown as { name: string } | null)?.name ?? "Course"}
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-400">
                      {s.start_date} &rarr; {s.end_date} {s.location ? `· ${s.location}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No upcoming course sessions.</EmptyState>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Upcoming hotel bookings
          </h2>
          {hotelBookings.data?.length ? (
            <ul className="space-y-3">
              {hotelBookings.data.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{b.guest_name}</p>
                    <p className="text-neutral-500 dark:text-neutral-400">
                      {(b.hotels as unknown as { name: string } | null)?.name} · {b.check_in} &rarr; {b.check_out}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No upcoming hotel bookings.</EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
