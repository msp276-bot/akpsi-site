import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "navy" | "gold" | "outlineWhite" | "outlineNavy" | "white";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-150 ease-out " +
  "hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-blue disabled:opacity-60 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  navy: "bg-navy text-white hover:bg-[#141d34] shadow-sm hover:shadow-md ring-offset-white",
  gold: "bg-gold text-navy hover:bg-[#c79a45] shadow-sm hover:shadow-md ring-offset-white",
  outlineWhite:
    "border border-white/70 text-white hover:bg-white/10 ring-offset-navy focus-visible:ring-white",
  outlineNavy:
    "border border-navy/25 text-navy hover:border-navy/50 hover:bg-navy/5 ring-offset-white",
  white:
    "bg-white text-navy hover:bg-slate-100 border border-line shadow-sm ring-offset-navy",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-4 py-2",
  md: "text-sm px-6 py-3",
  lg: "text-base px-8 py-3.5",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

type ButtonAsButton = CommonProps &
  ComponentProps<"button"> & { href?: undefined };
type ButtonAsLink = CommonProps &
  Omit<ComponentProps<typeof Link>, "className"> & { href: string };

export default function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "navy", size = "md", className = "" } = props;
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if ("href" in props && props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, href, ...rest } = props;
    return (
      <Link href={href} className={cls} {...rest} />
    );
  }

  const { variant: _v, size: _s, className: _c, ...rest } =
    props as ButtonAsButton;
  return <button className={cls} {...rest} />;
}
