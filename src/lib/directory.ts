import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Private member contact info (email + LinkedIn) for the portal directory. This
 * lives in Supabase (table `member_contacts`, RLS: authenticated-read only), NOT
 * in the site bundle, because the site is a static export - anything in src/
 * ships publicly. So these are fetched at runtime with the signed-in member's
 * session and are never exposed to logged-out visitors. See db/directory-contacts.sql.
 *
 * `slug` matches the member slug in src/data/members.ts so the directory can
 * join this onto the card it already renders.
 */
export interface MemberContact {
  slug: string;
  fullName: string;
  email: string;
  linkedin: string | null;
  cohort: string | null;
  classYear: string | null;
}

/**
 * Fetch every member contact the current session is allowed to see. Returns an
 * empty list when Supabase isn't configured (mock/preview mode) so no real
 * emails ever appear off a live, authenticated session.
 */
export async function listMemberContacts(): Promise<MemberContact[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("member_contacts")
    .select("slug, full_name, email, linkedin, cohort, class_year");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    slug: row.slug as string,
    fullName: (row.full_name as string) ?? "",
    email: (row.email as string) ?? "",
    linkedin: (row.linkedin as string) ?? null,
    cohort: (row.cohort as string) ?? null,
    classYear: (row.class_year as string) ?? null,
  }));
}
