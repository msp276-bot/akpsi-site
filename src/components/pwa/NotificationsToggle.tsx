"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  isPushConfigured,
  isPushSupported,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

/**
 * Portal control to opt in/out of chapter push notifications. Renders a clear
 * "not available yet" state until push is configured (VAPID key + Supabase),
 * so it's safe to ship while that infra is still dormant.
 */
export default function NotificationsToggle() {
  const { user } = useAuth();
  // Deterministic (feature detection), so init lazily instead of in an effect.
  const [supported] = useState(isPushSupported);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExistingSubscription()
      .then((s) => setSubscribed(Boolean(s)))
      .catch(() => {});
  }, []);

  async function toggle() {
    setError(null);
    setBusy(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        await subscribeToPush(user?.email ?? "");
        setSubscribed(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const available = supported && isPushConfigured;

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy/5 text-navy">
          {subscribed ? <Bell size={18} /> : <BellOff size={18} />}
        </span>
        <p className="font-semibold text-ink">Push notifications</p>
        {!available && (
          <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-muted">
            Coming soon
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-muted">
        Get alerts on this device when the chapter posts announcements and events.
      </p>

      {available ? (
        <button
          onClick={toggle}
          disabled={busy}
          className={`mt-4 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition-colors sm:w-auto ${
            subscribed
              ? "border border-line text-ink hover:bg-slate-50"
              : "bg-navy text-white hover:bg-navy/90"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : subscribed ? (
            "Turn off"
          ) : (
            "Turn on notifications"
          )}
        </button>
      ) : (
        <p className="mt-3 text-xs text-muted">
          {!supported
            ? "This browser doesn’t support push notifications. On iPhone, add the app to your Home Screen first, then open it from there."
            : "Turns on once the chapter’s backend is configured."}
        </p>
      )}

      {error && <p className="mt-3 text-xs text-scarlet">{error}</p>}
    </div>
  );
}
