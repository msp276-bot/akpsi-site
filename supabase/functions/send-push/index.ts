// Supabase Edge Function: send-push
// ---------------------------------------------------------------------------
// Fans a push notification out to every subscribed brother.
//
// Auth: the caller must be a signed-in roster MANAGER (president/admin). We
// verify their JWT against the members table before sending, so a regular
// member can't spam the chapter. Reading subscriptions + sending uses the
// service role (bypasses RLS).
//
// Deploy:  supabase functions deploy send-push
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... \
//            VAPID_SUBJECT=mailto:president@rutgers.edu
//          (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically)
//
// Invoke from the app:  supabase.functions.invoke("send-push", { body:
//            { title, body, url } })   — see src/lib/push.ts sendPushToChapter().
// ---------------------------------------------------------------------------
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:akpsi@rutgers.edu";

    // --- Verify the caller is a roster manager -----------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    const email = userData.user?.email?.toLowerCase();
    if (!email) return json({ error: "Not authenticated" }, 401);

    const { data: me } = await admin
      .from("members")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    if (!me || !["president", "admin"].includes(me.role)) {
      return json({ error: "Only the president or an admin can send notifications." }, 403);
    }

    // --- Build the payload -------------------------------------------------
    const { title, body, url } = await req.json();
    if (!title) return json({ error: "title is required" }, 400);
    const payload = JSON.stringify({ title, body: body ?? "", url: url ?? "/portal/", icon: "/icon-192.png" });

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    // --- Fan out -----------------------------------------------------------
    const { data: subs, error } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");
    if (error) return json({ error: error.message }, 500);

    let sent = 0;
    const dead: string[] = [];
    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
        } catch (e) {
          // 404/410 => subscription expired; prune it.
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) dead.push(s.endpoint);
        }
      }),
    );
    if (dead.length) {
      await admin.from("push_subscriptions").delete().in("endpoint", dead);
    }

    return json({ sent, pruned: dead.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
