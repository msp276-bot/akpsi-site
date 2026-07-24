/**
 * Renders an official Instagram post / reel embed.
 *
 * Uses Instagram's public `/embed` iframe endpoint, so it needs no API key,
 * access token, or third-party script — it works fine in a static export.
 * Accepts a full permalink (…/p/CODE/, …/reel/CODE/, …/tv/CODE/) or a bare
 * shortcode.
 */

function toEmbedSrc(urlOrCode: string): string | null {
  const value = urlOrCode.trim();
  const match = value.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (match) {
    return `https://www.instagram.com/${match[1]}/${match[2]}/embed/captioned`;
  }
  if (/^[A-Za-z0-9_-]+$/.test(value)) {
    return `https://www.instagram.com/p/${value}/embed/captioned`;
  }
  return null;
}

export default function InstagramEmbed({
  url,
  title = "Instagram post",
  className = "",
}: {
  url: string;
  title?: string;
  className?: string;
}) {
  const src = toEmbedSrc(url);
  if (!src) return null;

  return (
    <div
      className={`mx-auto w-full max-w-[540px] overflow-hidden rounded-2xl border border-line bg-white shadow-sm ${className}`}
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        scrolling="no"
        className="h-[680px] w-full border-0"
        allow="encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
