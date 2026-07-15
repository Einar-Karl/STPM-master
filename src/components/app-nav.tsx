"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: keyof typeof ICONS };
type NavGroup = { title: string; items: NavItem[] };

// Minimal inline icon set (24px viewBox, stroke style) so we don't pull a library.
const ICONS = {
  home: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10",
  calendar: "M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  briefcase: "M4 7h16a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18",
  users: "M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z",
  ticket: "M3 9V6a1 1 0 011-1h16a1 1 0 011 1v3a3 3 0 000 6v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3a3 3 0 000-6zM13 5v2M13 11v2M13 17v2",
  bed: "M2 4v16M2 8h18a2 2 0 012 2v10M2 17h20M6 8v9",
  boxes: "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5M12 13l9-5M12 13v9",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  sparkles: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z",
  clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h6",
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      title: "Overview",
      items: [{ href: "/dashboard", label: "Dashboard", icon: "home" }],
    },
    {
      title: "Planning",
      items: [
        { href: "/weeks", label: "Course Weeks", icon: "calendar" },
        { href: "/retros", label: "Retros", icon: "clipboard" },
        { href: "/teachers", label: "Teachers", icon: "users" },
        { href: "/courses", label: "Courses", icon: "book" },
      ],
    },
    {
      title: "CRM",
      items: [
        { href: "/sales", label: "Sales", icon: "briefcase" },
        { href: "/course-bookings", label: "Course Bookings", icon: "ticket" },
        { href: "/clients", label: "Clients", icon: "users" },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/hotels", label: "Hotels", icon: "bed" },
        { href: "/hotel-bookings", label: "Hotel Bookings", icon: "bed" },
        { href: "/resources", label: "Resources", icon: "boxes" },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Admin",
            items: [
              { href: "/staff", label: "Staff", icon: "shield" },
              { href: "/ai-settings", label: "AI Settings", icon: "sparkles" },
            ],
          } satisfies NavGroup,
        ]
      : []),
  ];

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto p-3 pt-0">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
