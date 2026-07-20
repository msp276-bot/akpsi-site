import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase is optional at build/preview time. When the two public env vars are
 * present the portal runs against the real shared backend; when they're absent
 * the app falls back to the in-browser mock (see AuthContext / lib/roles) so the
 * static preview keeps working without any credentials.
 *
 * Both vars are safe to expose to the browser: the anon key only grants what
 * Row-Level Security allows, and "president-only" writes are enforced server
 * side by RLS — never by this client.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;

/**
 * Returns the shared Supabase client, or null when the app is running in mock
 * mode. Callers must handle the null case (and generally should branch on
 * `isSupabaseConfigured` first).
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
