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
  ShieldCheck,
  Bell,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/ui/Logo";
import { getInitials } from "@/data/members";
import { hasPermission, roleLabel } from "@/lib/access";

const NAV = [
  { label: "Dashboard", href: "/portal/dashboard", Icon: LayoutDashboard },
  { label: "Events", href: "/portal/events", Icon: CalendarDays },
  { label: "Directory", href: "/portal/directory", Icon: Users },
  { label: "Documents", href: "/portal/documents", Icon: FolderOpen },
  { label: "Announcements", href: "/portal/announcements", Icon: Megaphone },
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
  ["/portal/dashboard", "/portal/events", "/portal/documents", "/portal/announcements"].includes(href)
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

  return (
    <div className="min-h-svh bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-navy text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Logo tone="light" />
            <span className="hidden text-xs uppercase tracking-widest text-white/50 sm:block">
              {roleLabel(user.role)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="relative grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:bg-white/10"
              aria-label="Notifications"
            >
              <Bell size={16} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-scarlet" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-white/50">{user.email}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gold text-sm font-bold text-navy">
              {getInitials(user.name)}
            </div>
            <button
              onClick={() => {
                signOut();
                router.replace("/portal");
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-5 py-8 sm:px-8">
        {/* Sidebar nav */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-1">
            {visibleNav.map(({ label, href, Icon }) => {
              const active = pathname === href;
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
