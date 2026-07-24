import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, Briefcase } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  members,
  getMemberBySlug,
  getInitials,
  GROUP_LABELS,
} from "@/data/members";

export function generateStaticParams() {
  return members.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const member = getMemberBySlug(slug);
  if (!member) return { title: "Member not found" };
  return {
    title: member.name,
    description: `${member.name} — ${member.position}${member.major ? `, ${member.major}` : ""}. Alpha Kappa Psi, Omicron Tau chapter at Rutgers University.`,
  };
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = getMemberBySlug(slug);
  if (!member) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-navy"
          >
            <ArrowLeft size={16} /> Back to Members
          </Link>

          <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
            {/* Navy header band */}
            <div className="h-28 bg-gradient-to-r from-navy to-navy-2" />

            <div className="px-6 pb-8 sm:px-10">
              <div className="-mt-14 flex flex-col items-center text-center sm:flex-row sm:items-end sm:gap-6 sm:text-left">
                <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-scarlet text-2xl font-bold text-white ring-4 ring-white">
                  {member.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="headline">{getInitials(member.name)}</span>
                  )}
                </div>
                <div className="mt-4 sm:mb-2 sm:mt-0">
                  <span className="inline-block rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy shadow-sm">
                    {GROUP_LABELS[member.group]}
                  </span>
                  <h1 className="mt-2 text-2xl font-bold text-ink">
                    {member.name}
                  </h1>
                  <p className="text-sm font-medium text-blue">
                    {member.position}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <GraduationCap size={18} className="mt-0.5 text-muted" />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {member.major ?? member.cohort ?? "Chapter Member"}
                    </p>
                    {member.minor && (
                      <p className="text-xs text-muted">
                        Minor · {member.minor}
                      </p>
                    )}
                    {member.major && member.cohort && (
                      <p className="text-xs text-muted">{member.cohort}</p>
                    )}
                    <p className="text-xs text-muted">
                      Class of {member.classYear}
                    </p>
                  </div>
                </div>
                {member.industry && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                    <Briefcase size={18} className="mt-0.5 text-muted" />
                    <div>
                      <p className="text-sm font-medium text-ink">
                        Industry interest
                      </p>
                      <p className="text-xs text-muted">{member.industry}</p>
                    </div>
                  </div>
                )}
              </div>

              {member.bio && (
                <p className="mt-6 text-sm leading-relaxed text-ink/80">
                  {member.bio}
                </p>
              )}

              {/* Contact details (email, LinkedIn) are intentionally NOT shown
                  on this public page — they live only in the authenticated
                  /portal/ member directory. See build spec §5.4. */}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
