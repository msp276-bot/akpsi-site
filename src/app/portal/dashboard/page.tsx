"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  FolderOpen,
  Megaphone,
  Check,
  MapPin,
  Sparkles,
  Hand,
  ArrowRight,
} from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import NotificationsToggle from "@/components/pwa/NotificationsToggle";
import { useAuth } from "@/context/AuthContext";
import { events, EVENT_TYPE_META } from "@/data/events";
import { members } from "@/data/members";
import { canAccessVisibility, portalRole } from "@/lib/access";
import { countdownLabel, formatEventTime, formatDayMonth } from "@/lib/date";

const QUICK_LINKS = [
  {
    label: "Events Calendar",
    href: "/portal/events",
    Icon: CalendarDays,
    desc: "RSVP and see what's coming up",
  },
  {
    label: "Member Directory",
    href: "/portal/directory",
    Icon: Users,
    desc: `${members.length} brothers across the chapter`,
  },
  {
    label: "Documents",
    href: "/portal/documents",
    Icon: FolderOpen,
    desc: "Bylaws, minutes, and resources",
  },
  {
    label: "Announcements",
    href: "/portal/announcements",
    Icon: Megaphone,
    desc: "Latest from the board",
  },
];

export default function DashboardPage() {
  return (
    <PortalShell>
      <DashboardContent />
    </PortalShell>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "there";
  const isPledge = user?.role === "pledge";
  const role = portalRole(user);
  const quickLinks = isPledge
    ? QUICK_LINKS.filter(({ href }) => href !== "/portal/directory")
    : QUICK_LINKS;

  // Local RSVP state (mock) - tracks which events the member is going to.
  const [rsvps, setRsvps] = useState<Record<string, boolean>>({});
  const toggle = (id: string) =>
    setRsvps((prev) => ({ ...prev, [id]: !prev[id] }));

  const upcoming = events
    .filter((event) => canAccessVisibility(event.visibility, role))
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
    .slice(0, 5);

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
        {isPledge ? (
          <>
            Welcome to pledge season, {firstName}
            <Sparkles size={22} className="shrink-0 text-gold" aria-hidden />
          </>
        ) : (
          <>
            Welcome back, {firstName}
            <Hand size={22} className="shrink-0 text-gold" aria-hidden />
          </>
        )}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {isPledge
          ? "Your pledge resources, chapter events, and cohort updates - all in one place."
          : "Here’s what’s happening in the Omicron Tau chapter this week."}
      </p>

      {/* Install-to-home-screen (hidden once installed/dismissed) */}
      <div className="mt-6">
        <InstallPrompt />
      </div>

      {/* Stat row */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Upcoming Events", value: upcoming.length },
          { label: isPledge ? "Pledge Resources" : "Chapter Members", value: isPledge ? 12 : 60 },
          { label: "Your RSVPs", value: Object.values(rsvps).filter(Boolean).length },
          { label: "New Docs", value: 3 },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-line bg-white p-4"
          >
            <div className="headline text-3xl text-navy">{s.value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Upcoming events */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Upcoming Events</h2>
            <Link
              href="/portal/events"
              className="group inline-flex items-center gap-1 text-sm font-medium text-blue hover:underline"
            >
              View calendar
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {upcoming.map((ev) => {
              const meta = EVENT_TYPE_META[ev.type];
              const { day, month } = formatDayMonth(ev.start);
              const going = rsvps[ev.id];
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-slate-50 py-2">
                    <span className="text-lg font-bold leading-none text-navy">
                      {day}
                    </span>
                    <span className="text-[10px] font-semibold tracking-wide text-muted">
                      {month}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      <span className={`text-[11px] font-semibold uppercase tracking-wide ${meta.text}`}>
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-muted">
                        · {countdownLabel(ev.start)}
                      </span>
                    </div>
                    <h3 className="mt-0.5 truncate font-semibold text-ink">
                      {ev.title}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <MapPin size={12} /> {ev.location} · {formatEventTime(ev.start)}
                    </p>
                  </div>

                  <button
                    onClick={() => toggle(ev.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      going
                        ? "bg-navy text-white"
                        : "border border-line text-navy hover:border-navy"
                    }`}
                  >
                    {going ? (
                      <span className="inline-flex items-center gap-1">
                        <Check size={13} /> Going · {ev.going + 1}
                      </span>
                    ) : (
                      <>RSVP · {ev.going}</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick links */}
        <section>
          <h2 className="text-lg font-semibold text-ink">Quick Access</h2>
          <div className="mt-4 space-y-3">
            {quickLinks.map(({ label, href, Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 rounded-xl border border-line bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy/5 text-navy transition-colors group-hover:bg-navy group-hover:text-white">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{label}</h3>
                  <p className="text-xs text-muted">{desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6">
            <NotificationsToggle />
          </div>
        </section>
      </div>
    </div>
  );
}
