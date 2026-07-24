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
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isPushSupported());
    getExistingSubscription().then((s) => setSubscribed(Boolean(s)));
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy/5 text-navy">
            {subscribed ? <Bell size={18} /> : <BellOff size={18} />}
          </span>
          <div>
            <p className="font-semibold text-ink">Push notifications</p>
            <p className="mt-0.5 text-sm text-muted">
              Get alerts on this device when the chapter posts announcements and events.
            </p>
          </div>
        </div>

        <button
          onClick={toggle}
          disabled={!available || busy}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
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
            "Turn on"
          )}
        </button>
      </div>

      {!supported && (
        <p className="mt-3 text-xs text-muted">
          This browser doesn&rsquo;t support push notifications. On iPhone, add the app to your
          Home Screen first, then open it from there.
        </p>
      )}
      {supported && !isPushConfigured && (
        <p className="mt-3 text-xs text-muted">
          Not available yet - push notifications turn on once the chapter&rsquo;s backend is
          configured.
        </p>
      )}
      {error && <p className="mt-3 text-xs text-scarlet">{error}</p>}
    </div>
  );
}
