"use client";

import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Public LinkedIn links for the members pages, keyed by member slug. Comes from
 * the `public_member_linkedins()` RPC (db/public-linkedin.sql), which exposes
 * only slug + LinkedIn URL - never emails. Fetched once per page load and
 * shared by every card.
 */
let cache: Promise<Record<string, string>> | null = null;

function normalize(url: string): string {
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function loadPublicLinkedins(): Promise<Record<string, string>> {
  if (cache) return cache;
  cache = (async () => {
    if (!isSupabaseConfigured) return {};
    const supabase = getSupabase();
    if (!supabase) return {};
    const { data, error } = await supabase.rpc("public_member_linkedins");
    if (error || !Array.isArray(data)) return {};
    const out: Record<string, string> = {};
    for (const row of data as { slug: string; linkedin: string }[]) {
      if (row.slug && row.linkedin) out[row.slug] = normalize(row.linkedin);
    }
    return out;
  })().catch(() => ({}));
  return cache;
}

/** LinkedIn URL for one member, or null (none on file / still loading). */
export function useMemberLinkedin(slug: string): string | null {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    loadPublicLinkedins().then((m) => {
      if (active) setMap(m);
    });
    return () => {
      active = false;
    };
  }, []);
  return map[slug] ?? null;
}
