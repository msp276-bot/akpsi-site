import Link from "next/link";
import { Mail } from "lucide-react";
import { LinkedinIcon, InstagramIcon } from "@/components/BrandIcons";
import Logo from "@/components/ui/Logo";
import { SOCIAL } from "@/data/social";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Members", href: "/#members" },
  { label: "Rush", href: "/rush" },
  { label: "Sign In", href: "/portal" },
];

const SOCIALS = [
  { label: "LinkedIn", href: SOCIAL.linkedin, Icon: LinkedinIcon },
  { label: "Instagram", href: SOCIAL.instagram, Icon: InstagramIcon },
  { label: "Email", href: "mailto:omicrontau@rutgers.edu", Icon: Mail },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white/80">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo tone="light" withWordmark />
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              The Omicron Tau chapter of Alpha Kappa Psi — a co-ed professional
              business fraternity at Rutgers University–New Brunswick.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gold">
              Quick Links
            </h3>
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gold">
              Connect
            </h3>
            <div className="flex gap-3">
              {SOCIALS.map(({ label, href, Icon }) => {
                const external = !href.startsWith("mailto:");
                return (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/80 transition-all hover:border-gold hover:text-gold"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/50">
            © 2026 Alpha Kappa Psi — Omicron Tau Chapter, Rutgers University
          </p>
          <p className="text-xs text-white/40">
            Omicron Tau Chapter ·{" "}
            <span className="text-scarlet/80">Rutgers University</span>
            –New Brunswick
          </p>
        </div>
      </div>
    </footer>
  );
}
