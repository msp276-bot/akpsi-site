/** Demo "now" so the mock calendar stays sensible regardless of real date. */
export const DEMO_NOW = new Date("2026-07-18T09:00:00");

export function countdownLabel(iso: string, now: Date = DEMO_NOW): string {
  const target = new Date(iso);
  const ms = target.getTime() - now.getTime();
  const dayMs = 86_400_000;

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  ).getTime();
  const dayDiff = Math.round((startOfTarget - startOfToday) / dayMs);

  if (ms < 0) return "Past";
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff < 7) return `In ${dayDiff} days`;
  if (dayDiff < 14) return "In 1 week";
  return `In ${Math.round(dayDiff / 7)} weeks`;
}

export function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDayMonth(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: d.toLocaleString("en-US", { day: "numeric" }),
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
  };
}
