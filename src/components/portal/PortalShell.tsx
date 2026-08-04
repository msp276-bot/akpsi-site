"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FolderOpen,
  Megaphone,
  LogOut,
  ClipboardList,
  ClipboardCheck,
  CalendarPlus,
  BarChart3,
  Award,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/components/portal/NotificationBell";
import { getInitials } from "@/data/members";
import { hasPermission, roleLabel } from "@/lib/access";

const NAV = [
  { label: "Dashboard", href: "/portal/dashboard", Icon: LayoutDashboard },
  { label: "Events", href: "/portal/events", Icon: CalendarDays },
  { label: "Directory", href: "/portal/directory", Icon: Users },
  { label: "Documents", href: "/portal/documents", Icon: FolderOpen },
  { label: "Announcements", href: "/portal/announcements", Icon: Megaphone },
  {
    label: "Points",
    href: "/portal/points",
    Icon: Award,
    // Everyone who can submit sees their points + submission history.
    permission: "submissions:submit" as const,
  },
  {
    label: "Review",
    href: "/portal/review",
    Icon: ClipboardCheck,
    // VP Ops / e-board approve or deny submissions.
    permission: "submissions:review" as const,
  },
  {
    label: "Point Events",
    href: "/portal/point-events",
    Icon: CalendarPlus,
    // VP Ops / e-board create the events brothers submit for points.
    permission: "submissions:review" as const,
  },
  {
    label: "Leaderboard",
    href: "/portal/standings",
    Icon: BarChart3,
    // Every member sees the ranked leaderboard (totals only); reviewers also get
    // the per-submission drill-down on the same page.
    permission: "submissions:submit" as const,
  },
  {
    label: "Applications",
    href: "/portal/applications",
    Icon: ClipboardList,
    permission: "read:applications" as const,
  },
  {
    label: "Admin",
    href: "/portal/admin",
    Icon: ShieldCheck,
    // President reaches the admin area for role management; admin sees it via admin:*.
    permission: "manage:roles" as const,
  },
];

const PLEDGE_NAV = NAV.filter(({ href }) =>
  [
    "/portal/dashboard",
    "/portal/events",
    "/portal/documents",
    "/portal/announcements",
    "/portal/points",
    "/portal/standings",
  ].includes(href)
);

export default function PortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/portal");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-svh place-items-center bg-slate-50 text-muted">
        Loading portal…
      </div>
    );
  }

  const isPledge = user.role === "pledge";
  const visibleNav = (isPledge ? PLEDGE_NAV : NAV).filter(
    ({ permission }) => !permission || hasPermission(user.role, permission)
  );

  // `trailingSlash: true` means usePathname() returns "/portal/events/" while
  // the NAV hrefs are written without the slash, so a raw === comparison never
  // matches and no nav item ever highlights. Compare them normalised.
  const currentPath = pathname.replace(/\/+$/, "");
  const isActive = (href: string) => currentPath === href.replace(/\/+$/, "");

  return (
    <div className="min-h-svh bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-navy text-white">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-8">
          {/* The wordmark is ~250px and never wraps, so it is dropped below sm
              to stop the header overflowing on a phone. */}
          <div className="flex min-w-0 items-center gap-3">
            <Logo tone="light" wordmarkClassName="hidden sm:flex" />
          </div>
          {/* Portal label, centered across the whole bar (absolute so it centers
              on the header, not between the flanking groups). */}
          <span className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-xs uppercase tracking-widest text-white/50 lg:block">
            {roleLabel(user.role)}
          </span>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <NotificationBell role={user.role} email={user.email} />
            <div className="hidden text-right lg:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-white/50">{user.email}</p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-navy">
              {getInitials(user.name)}
            </div>
            {/* Icon-only below sm; the label costs ~70px the phone cannot spare. */}
            <button
              onClick={() => {
                signOut();
                router.replace("/portal");
              }}
              aria-label="Sign out"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-2.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 sm:px-3"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav. The sidebar below is desktop-only, so without this strip
          there is no way to reach Events / Directory / Documents / etc. on a
          phone. Scrolls horizontally to absorb the 7th item for admins. */}
      <nav className="sticky top-16 z-30 border-b border-line bg-white lg:hidden">
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleNav.map(({ label, href, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-navy text-white"
                    : "bg-slate-100 text-ink hover:bg-slate-200"
                }`}
              >
                <Icon size={15} /> {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-8 sm:py-8">
        {/* Sidebar nav */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-1">
            {visibleNav.map(({ label, href, Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-navy text-white"
                      : "text-ink hover:bg-white"
                  }`}
                >
                  <Icon size={17} /> {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
