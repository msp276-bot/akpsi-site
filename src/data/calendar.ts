/**
 * Google Calendar integration for the member portal.
 *
 * Read-only by design: the site is a static export with no backend/OAuth, so we
 * (a) embed the chapter's PUBLIC Google Calendar as an iframe, and
 * (b) generate "Add to Google Calendar" template links per event.
 * Neither needs an API key or server. Admins manage events in Google Calendar;
 * the portal displays and links to them.
 *
 * EDIT ME: paste the chapter's PUBLIC Google Calendar ID (Google Calendar →
 * Settings → <calendar> → "Integrate calendar" → Calendar ID). The calendar
 * must be shared publicly or the embed renders empty. Leave "" for a placeholder.
 */
export const GOOGLE_CALENDAR_ID =
  "c_c1a79396869cbf6257effd4bf694505c102690ef92a6ebd7617e24ebf2ebb0b8@group.calendar.google.com";
export const CALENDAR_TIMEZONE = "America/New_York";

/** Embed URL for the read-only month view of a public calendar. */
export function googleCalendarEmbedSrc(calendarId: string): string {
  const params = new URLSearchParams({
    src: calendarId,
    ctz: CALENDAR_TIMEZONE,
    mode: "MONTH",
    showTitle: "0",
    showPrint: "0",
    showTabs: "1",
    showCalendars: "0",
  });
  return `https://calendar.google.com/calendar/embed?${params.toString()}`;
}

// Google Calendar "TEMPLATE" links want basic UTC timestamps: YYYYMMDDTHHMMSSZ
function gcalStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * A "one-click add to Google Calendar" link for a single event. Works with no
 * calendar ID — it just prefills Google's event-creation form from the event.
 */
export function addToGoogleCalendarUrl(event: {
  title: string;
  start: string;
  end?: string;
  location?: string;
  description?: string;
}): string {
  const start = new Date(event.start);
  const end = event.end
    ? new Date(event.end)
    : new Date(start.getTime() + 60 * 60 * 1000); // default 1h
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`,
    ctz: CALENDAR_TIMEZONE,
  });
  if (event.location) params.set("location", event.location);
  if (event.description) params.set("details", event.description);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
