import {
  Rocket,
  Award,
  CheckCircle2,
  Star,
  Trophy,
  Sparkles,
  Lock,
} from "lucide-react";

/**
 * Gamified achievement badges for a member's own Points page. Everything is
 * derived from the member's approved submissions + their requirement targets -
 * no extra backend. Earned badges light up gold; locked ones stay muted and
 * show the concrete next step, so the wall doubles as a to-do list.
 */
interface AchievementsProps {
  points: number;
  hours: number;
  pointsRequired: number;
  hoursRequired: number;
  approvedCount: number;
}

interface Badge {
  key: string;
  label: string;
  desc: string;
  Icon: typeof Award;
  earned: boolean;
  hint: string;
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

export default function Achievements({
  points,
  hours,
  pointsRequired,
  hoursRequired,
  approvedCount,
}: AchievementsProps) {
  const pointsMet = pointsRequired > 0 && points >= pointsRequired;
  const hoursMet = hoursRequired > 0 && hours >= hoursRequired;
  const overGoal = Math.ceil(pointsRequired * 1.5);

  const badges: Badge[] = [
    {
      key: "first",
      label: "First Steps",
      desc: "First approved submission",
      Icon: Rocket,
      earned: approvedCount >= 1,
      hint: "Submit your first event or service hours",
    },
    {
      key: "ten",
      label: "In the Points",
      desc: "Earn 10 points",
      Icon: Award,
      earned: points >= 10,
      hint: `${plural(Math.max(0, 10 - points), "point")} to go`,
    },
    {
      key: "points",
      label: "Points Cleared",
      desc: "Hit your points goal",
      Icon: CheckCircle2,
      earned: pointsMet,
      hint: `${plural(Math.max(0, pointsRequired - points), "point")} to go`,
    },
    {
      key: "service",
      label: "Service Star",
      desc: "Hit your service-hours goal",
      Icon: Star,
      earned: hoursMet,
      hint: `${plural(Math.max(0, hoursRequired - hours), "hour")} to go`,
    },
    {
      key: "both",
      label: "Fully Cleared",
      desc: "Meet both requirements",
      Icon: Trophy,
      earned: pointsMet && hoursMet,
      hint: "Clear both points and service hours",
    },
    {
      key: "over",
      label: "Overachiever",
      desc: "150% of your points goal",
      Icon: Sparkles,
      earned: pointsRequired > 0 && points >= overGoal,
      hint: `${plural(Math.max(0, overGoal - points), "point")} past your goal`,
    },
  ];

  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy">Achievements</h2>
        <span className="text-sm font-semibold text-muted">
          {earned} / {badges.length}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {badges.map((b) => (
          <div
            key={b.key}
            title={b.earned ? b.desc : b.hint}
            className={`flex flex-col items-center rounded-xl border p-4 text-center transition-colors ${
              b.earned
                ? "border-gold/40 bg-gold/10"
                : "border-line bg-slate-50"
            }`}
          >
            <span
              className={`grid h-11 w-11 place-items-center rounded-full ${
                b.earned ? "bg-gold text-navy" : "bg-slate-200 text-slate-400"
              }`}
            >
              {b.earned ? <b.Icon size={20} /> : <Lock size={16} />}
            </span>
            <p
              className={`mt-2 text-sm font-semibold ${
                b.earned ? "text-navy" : "text-muted"
              }`}
            >
              {b.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted">
              {b.earned ? b.desc : b.hint}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
