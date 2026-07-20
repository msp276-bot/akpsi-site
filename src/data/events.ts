export type EventType = "professional" | "social" | "recruitment" | "general";

import type { Visibility } from "@/lib/access";

export interface ChapterEvent {
  id: string;
  title: string;
  /** ISO date string, e.g. "2026-07-24T18:00:00" */
  start: string;
  location: string;
  type: EventType;
  description: string;
  going: number;
  end?: string;
  mapUrl?: string;
  maxAttendees?: number;
  requiresRsvp?: boolean;
  visibility?: Visibility;
  attendees?: string[];
}

export const EVENT_TYPE_META: Record<
  EventType,
  { label: string; dot: string; text: string; bg: string }
> = {
  professional: {
    label: "Professional",
    dot: "bg-navy",
    text: "text-navy",
    bg: "bg-navy/10",
  },
  social: { label: "Social", dot: "bg-gold", text: "text-gold", bg: "bg-gold/15" },
  recruitment: {
    label: "Recruitment",
    dot: "bg-scarlet",
    text: "text-scarlet",
    bg: "bg-scarlet/10",
  },
  general: {
    label: "General",
    dot: "bg-muted",
    text: "text-muted",
    bg: "bg-muted/10",
  },
};

/** Mock upcoming events relative to the demo "today" of 2026-07-18. */
export const events: ChapterEvent[] = [
  {
    id: "e1",
    title: "Spring '27 Rush Info Session",
    start: "2026-07-19T18:00:00",
    location: "Business School, Room 1140",
    type: "recruitment",
    description:
      "Kick off the recruitment cycle. Meet the brothers, learn what AKPsi is about, and get your questions answered.",
    going: 34,
    end: "2026-07-19T19:30:00",
    mapUrl: "https://maps.google.com/?q=Rutgers+Business+School",
    requiresRsvp: true,
    visibility: "public",
    attendees: ["AT", "ML", "PN", "ER"],
  },
  {
    id: "e2",
    title: "Resume Workshop with Alumni",
    start: "2026-07-22T19:00:00",
    location: "Livingston Student Center",
    type: "professional",
    description:
      "Bring your resume for one-on-one reviews with alumni working in consulting, finance, and tech.",
    going: 21,
    end: "2026-07-22T20:30:00",
    mapUrl: "https://maps.google.com/?q=Livingston+Student+Center",
    maxAttendees: 30,
    requiresRsvp: true,
    visibility: "members",
    attendees: ["AT", "ML", "PN", "ER"],
  },
  {
    id: "e3",
    title: "Chapter Social — Bowling Night",
    start: "2026-07-25T20:00:00",
    location: "New Brunswick Bowl",
    type: "social",
    description:
      "Wind down the week with the chapter. Shoes on us — friendly competition encouraged.",
    going: 42,
    end: "2026-07-25T22:00:00",
    requiresRsvp: true,
    visibility: "active",
    attendees: ["AT", "ML", "PN", "ER"],
  },
  {
    id: "e4",
    title: "Weekly Chapter Meeting",
    start: "2026-07-27T19:30:00",
    location: "Business School, Room 1050",
    type: "general",
    description:
      "Standing weekly meeting. Committee updates, announcements, and planning for the week ahead.",
    going: 58,
    end: "2026-07-27T20:45:00",
    requiresRsvp: true,
    visibility: "active",
    attendees: ["AT", "ML", "PN", "ER"],
  },
  {
    id: "e5",
    title: "Professional Night: Careers Panel",
    start: "2026-07-30T18:30:00",
    location: "Bloustein School Atrium",
    type: "professional",
    description:
      "Hear brothers and alumni talk through their career paths across ten-plus industries.",
    going: 27,
    end: "2026-07-30T20:00:00",
    maxAttendees: 50,
    requiresRsvp: true,
    visibility: "members",
    attendees: ["AT", "ML", "PN", "ER"],
  },
  {
    id: "e6",
    title: "Meet & Greet Coffee Chat",
    start: "2026-08-02T15:00:00",
    location: "Alexander Library Café",
    type: "recruitment",
    description:
      "Casual coffee chats for prospective members to connect with the chapter one-on-one.",
    going: 18,
    end: "2026-08-02T16:30:00",
    requiresRsvp: true,
    visibility: "public",
    attendees: ["AT", "ML", "PN"],
  },
  {
    id: "e7",
    title: "Pledge Education: Values Workshop",
    start: "2026-08-04T18:30:00",
    location: "Student Activities Center, Room 411",
    type: "general",
    description:
      "A pledge-cohort workshop on chapter values, professional standards, and the traditions that shape Omicron Tau.",
    going: 16,
    end: "2026-08-04T20:00:00",
    requiresRsvp: true,
    visibility: "pledge",
    attendees: ["JR", "SK", "NM"],
  },
  {
    id: "e8",
    title: "E-Board Recruitment Strategy Sync",
    start: "2026-08-06T20:00:00",
    location: "Virtual — Board Zoom",
    type: "general",
    description:
      "Board-only planning session for rush logistics, interview coverage, attendance review, and committee ownership.",
    going: 9,
    end: "2026-08-06T21:00:00",
    requiresRsvp: true,
    visibility: "eboard",
    attendees: ["AT", "SR", "EC"],
  },
];
