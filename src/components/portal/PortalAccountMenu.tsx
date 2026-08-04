"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { getInitials } from "@/data/members";

/**
 * Account menu: collapses the name/email block and Sign out into a single
 * avatar-triggered dropdown so the portal header stays uncluttered.
 */
export default function PortalAccountMenu({
  name,
  email,
  roleLabel,
  onSignOut,
}: {
  name: string;
  email: string;
  roleLabel: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-navy ring-2 ring-transparent transition-[box-shadow] hover:ring-white/30"
      >
        {getInitials(name)}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-line bg-white text-ink shadow-2xl">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
              {roleLabel}
            </span>
          </div>

          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-slate-50"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-muted">
              <LogOut size={16} />
            </span>
            <span className="flex-1">Sign out</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
