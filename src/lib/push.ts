import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Web Push subscription helpers (browser side).
 *
 * Push is "configured" only when BOTH a VAPID public key and Supabase are set.
 * Until then everything below no-ops gracefully so the PWA still installs and
 * runs offline - the notification toggle simply reports "not yet available".
 *
 * Flow when live:
 *   1) subscribeToPush() asks the browser for permission, subscribes via the
 *      service worker's PushManager using the VAPID public key, and upserts the
 *      subscription into Supabase (`push_subscriptions`, RLS-guarded).
 *   2) The Supabase `send-push` Edge Function reads those rows and sends pushes
 *      (e.g. when the president publishes an announcement).
 *   3) The service worker's `push` handler shows the notification.
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

/** True when push can actually be turned on (keys + backend present). */
export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY) && isSupabaseConfigured;

/** True when this browser can do service-worker push at all. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Current push subscription for this browser, if any. */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/**
 * Subscribe this browser to push and persist the subscription for the signed-in
 * member. Returns the subscription, or throws a user-readable error.
 */
export async function subscribeToPush(memberEmail: string): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error("This browser doesn't support push notifications.");
  }
  if (!isPushConfigured || !VAPID_PUBLIC_KEY) {
    throw new Error(
      "Push notifications aren't set up yet. An admin needs to add the VAPID key and Supabase config."
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notifications were blocked. Enable them in your browser settings to opt in.");
  }

  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const supabase = getSupabase();
  if (supabase) {
    const json = sub.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        member_email: memberEmail.toLowerCase(),
      },
      { onConflict: "endpoint" }
    );
    if (error) throw new Error(error.message);
  }
  return sub;
}

/** Unsubscribe this browser and remove the stored subscription. */
export async function unsubscribeFromPush(): Promise<void> {
  const sub = await getExistingSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
}

/**
 * Fan a message out to all subscribed brothers via the Supabase `send-push`
 * Edge Function. Called when the president publishes an announcement/event.
 * No-ops (returns false) when push isn't configured yet.
 */
export async function sendPushToChapter(payload: {
  title: string;
  body: string;
  url?: string;
}): Promise<boolean> {
  if (!isPushConfigured) return false;
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.functions.invoke("send-push", { body: payload });
  if (error) {
    console.error("send-push failed:", error.message);
    return false;
  }
  return true;
}
