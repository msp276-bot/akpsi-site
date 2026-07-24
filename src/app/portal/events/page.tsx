"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, ExternalLink,
  LayoutGrid, List, MapPin, Plus, UsersRound, X,
} from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { events, EVENT_TYPE_META, type ChapterEvent, type EventType } from "@/data/events";
import { canAccessVisibility, isEboardOrAdmin, portalRole, visibilityLabel } from "@/lib/access";
import { countdownLabel, formatEventTime } from "@/lib/date";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { GOOGLE_CALENDAR_ID, googleCalendarEmbedSrc, addToGoogleCalendarUrl } from "@/data/calendar";

const TYPES = Object.keys(EVENT_TYPE_META) as EventType[];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type CalendarView = "month" | "week" | "list" | "google";
type Rsvp = "going" | "maybe" | "declined" | "waitlist";

export default function EventsPage() {
  return <PortalShell><EventsCalendar /></PortalShell>;
}

function EventsCalendar() {
  const { user } = useAuth();
  const role = portalRole(user);
  const isBoard = isEboardOrAdmin(role);
  const [cursor, setCursor] = useState(new Date(2026, 6, 1));
  const [view, setView] = useState<CalendarView>("month");
  const [active, setActive] = useState<Set<EventType>>(new Set(TYPES));
  const [selected, setSelected] = useState<ChapterEvent | null>(null);
  const [rsvps, setRsvps] = useState<Record<string, Rsvp>>({});
  const [allEvents, setAllEvents] = useState(events);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => allEvents.filter((event) => canAccessVisibility(event.visibility, role) && active.has(event.type)), [allEvents, active, role]);
  const chronological = useMemo(() => [...filtered].sort((a,b) => +new Date(a.start) - +new Date(b.start)), [filtered]);
  const byDay = useMemo(() => {
    const map = new Map<string, ChapterEvent[]>();
    filtered.forEach((event) => {
      const date = new Date(event.start);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), event]);
    });
    return map;
  }, [filtered]);
  const year = cursor.getFullYear(); const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1)];
  const weekStart = new Date(cursor); weekStart.setDate(cursor.getDate() - cursor.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });
  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });
  const updateRsvp = (id: string, status: Rsvp) => setRsvps((current) => ({ ...current, [id]: status }));
  const toggleType = (type: EventType) => setActive((current) => { const next = new Set(current); if (next.has(type)) next.delete(type); else next.add(type); return next; });
  const addEvent = (event: ChapterEvent) => { setAllEvents((current) => [...current, event]); setShowCreate(false); };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-ink">Chapter calendar</h1><p className="mt-1 text-sm text-muted">{isBoard ? "All events, attendance, and scheduling controls." : "Your events, details, and RSVP status in one place."}</p></div>
        <div className="flex items-center gap-2">
          {isBoard && <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"><Plus size={16} /> Create event</button>}
          <div className="inline-flex rounded-lg border border-line bg-white p-1">
            {[["month", LayoutGrid, "Month"], ["week", CalendarPlus, "Week"], ["list", List, "List"], ["google", CalendarDays, "Google"]].map(([key, Icon, label]) => <button key={key as string} onClick={() => setView(key as CalendarView)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${view === key ? "bg-navy text-white" : "text-muted"}`}><Icon size={15} /> {label as string}</button>)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[210px_1fr]">
        <aside><h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Filter by type</h2><div className="mt-3 space-y-1.5">{TYPES.map((type) => { const meta = EVENT_TYPE_META[type]; const on = active.has(type); return <button key={type} onClick={() => toggleType(type)} className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${on ? "border-line bg-white text-ink" : "border-transparent text-muted opacity-60"}`}><span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />{meta.label}</button>; })}</div>
          <div className="mt-7 rounded-xl border border-gold/25 bg-gold/10 p-4 text-xs leading-relaxed text-navy"><span className="font-semibold">Timezone</span><br />America/New_York<br /><span className="mt-2 block text-muted">Event details are visible based on your chapter access.</span></div>
        </aside>
        <section>
          {view === "google" ? (
            <GoogleCalendarPanel />
          ) : (
            <>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-ink">{view === "week" ? `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : monthLabel}</h2><div className="flex gap-1"><button onClick={() => setCursor(new Date(year, view === "week" ? month : month - 1, view === "week" ? cursor.getDate() - 7 : 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-muted hover:text-navy" aria-label="Previous"><ChevronLeft size={16} /></button><button onClick={() => setCursor(new Date(year, view === "week" ? month : month + 1, view === "week" ? cursor.getDate() + 7 : 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-muted hover:text-navy" aria-label="Next"><ChevronRight size={16} /></button></div></div>
          {view === "month" && <MonthGrid cells={cells} year={year} month={month} byDay={byDay} onSelect={setSelected} />}
          {view === "week" && <WeekGrid days={weekDays} byDay={byDay} onSelect={setSelected} isBoard={isBoard} />}
          {view === "list" && <div className="space-y-3">{chronological.map((event) => <EventRow key={event.id} event={event} onSelect={setSelected} status={rsvps[event.id]} showVisibility={isBoard} />)}</div>}
            </>
          )}
        </section>
      </div>

      <AnimatePresence>{selected && <><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelected(null)} className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" /><motion.aside initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{duration:.3,ease:EASE_OUT_EXPO}} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"><EventDetail event={selected} status={rsvps[selected.id]} onRsvp={(status) => updateRsvp(selected.id,status)} isBoard={isBoard} onClose={() => setSelected(null)} /></motion.aside></>}</AnimatePresence>
      <AnimatePresence>{showCreate && <CreateEvent onClose={() => setShowCreate(false)} onCreate={addEvent} />}</AnimatePresence>
    </div>
  );
}

function MonthGrid({ cells, year, month, byDay, onSelect }: { cells:(number|null)[]; year:number; month:number; byDay:Map<string,ChapterEvent[]>; onSelect:(event:ChapterEvent)=>void }) { return <div className="overflow-hidden rounded-xl border border-line bg-white"><div className="grid grid-cols-7 border-b border-line bg-slate-50">{WEEKDAYS.map((day) => <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">{day}</div>)}</div><div className="grid grid-cols-7">{cells.map((day,i) => { const key = day ? `${year}-${month}-${day}` : `empty-${i}`; const items = day ? byDay.get(key) ?? [] : []; return <div key={key} className={`min-h-[92px] border-b border-r border-line p-1.5 [&:nth-child(7n)]:border-r-0 ${day ? "" : "bg-slate-50/50"}`}>{day && <><div className="mb-1 grid h-6 w-6 place-items-center rounded-full text-xs font-medium text-muted">{day}</div><div className="space-y-1">{items.map((event) => {const meta=EVENT_TYPE_META[event.type];return <button key={event.id} onClick={()=>onSelect(event)} className={`flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] font-medium hover:scale-[1.03] ${meta.bg} ${meta.text}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} /><span className="truncate">{event.title}</span></button>;})}</div></>}</div>;})}</div></div>; }

function WeekGrid({days,byDay,onSelect,isBoard}:{days:Date[];byDay:Map<string,ChapterEvent[]>;onSelect:(e:ChapterEvent)=>void;isBoard:boolean}) { return <div className="overflow-x-auto rounded-xl border border-line bg-white"><div className="grid min-w-[720px] grid-cols-7">{days.map((day) => {const key=`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;const items=byDay.get(key)??[];return <div key={key} className="min-h-[480px] border-r border-line last:border-r-0"><div className="border-b border-line bg-slate-50 px-3 py-3 text-center"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{WEEKDAYS[day.getDay()]}</p><p className="mt-1 text-lg font-bold text-navy">{day.getDate()}</p></div><div className="space-y-2 p-2">{items.map((event) => {const meta=EVENT_TYPE_META[event.type];return <button key={event.id} onClick={()=>onSelect(event)} className={`w-full rounded-lg p-2 text-left text-xs ${meta.bg} ${meta.text}`}><span className="block font-semibold">{event.title}</span><span className="mt-1 block opacity-70">{new Date(event.start).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</span></button>;})}{isBoard && <button className="mt-3 w-full rounded-lg border border-dashed border-line py-2 text-[11px] text-muted hover:border-navy hover:text-navy">+ Add event</button>}</div></div>;})}</div></div>; }

function EventRow({event,onSelect,status,showVisibility=false}:{event:ChapterEvent;onSelect:(e:ChapterEvent)=>void;status?:Rsvp;showVisibility?:boolean}) { const meta=EVENT_TYPE_META[event.type];return <button onClick={()=>onSelect(event)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-4 text-left hover:shadow-sm"><span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`}/><div className="min-w-0 flex-1"><h3 className="truncate font-semibold text-ink">{event.title}</h3><p className="text-xs text-muted">{formatEventTime(event.start)} · {event.location}</p></div>{showVisibility && <span className="hidden rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-navy sm:inline-flex">{visibilityLabel(event.visibility)}</span>}{status && <span className="rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-semibold capitalize text-navy">{status}</span>}<span className="shrink-0 text-xs font-medium text-blue">{countdownLabel(event.start)}</span></button>; }

function EventDetail({event,status,onRsvp,isBoard,onClose}:{event:ChapterEvent;status?:Rsvp;onRsvp:(s:Rsvp)=>void;isBoard:boolean;onClose:()=>void}) { const meta=EVENT_TYPE_META[event.type]; const atCap=!!event.maxAttendees && event.going >= event.maxAttendees; return <div className="flex h-full flex-col"><div className="flex items-start justify-between border-b border-line p-6"><div><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.bg} ${meta.text}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}/>{meta.label}</span><h2 className="mt-3 text-xl font-bold text-ink">{event.title}</h2></div><button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-slate-100" aria-label="Close"><X size={18}/></button></div><div className="flex-1 space-y-5 overflow-y-auto p-6"><div className="flex items-center gap-2 text-sm text-ink"><Clock size={16} className="text-muted"/>{formatEventTime(event.start)}</div><div className="flex items-start gap-2 text-sm text-ink"><MapPin size={16} className="mt-0.5 text-muted"/><span>{event.location}{event.mapUrl && <a className="ml-2 inline-flex items-center gap-1 text-blue hover:underline" href={event.mapUrl} target="_blank" rel="noreferrer">Map <ExternalLink size={12}/></a>}</span></div><p className="text-sm leading-relaxed text-muted">{event.description}</p><div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-sm text-ink"><UsersRound size={16} className="text-muted"/><strong>{event.going + (status === "going" ? 1 : 0)}</strong> going</span>{event.maxAttendees && <span className="text-xs text-muted">{event.maxAttendees} capacity</span>}</div><div className="mt-3 flex -space-x-2">{(event.attendees ?? ["AT","ML","PN"]).map((initials,index)=><span key={`${initials}-${index}`} className="grid h-7 w-7 place-items-center rounded-full border-2 border-slate-50 bg-navy text-[9px] font-bold text-white">{initials}</span>)}<span className="grid h-7 min-w-7 place-items-center rounded-full border-2 border-slate-50 bg-gold px-1 text-[9px] font-bold text-navy">+{Math.max(0,event.going-4)}</span></div></div>{isBoard && <div className="rounded-xl border border-gold/30 bg-gold/10 p-4"><p className="font-semibold text-navy">E-Board controls</p><p className="mt-1 text-xs text-muted">Attendance tracking and event editing are enabled for this event.</p><button className="mt-3 rounded-full border border-navy/20 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy hover:text-white">Manage attendance</button></div>}</div><div className="border-t border-line p-6"><div className="mb-3 grid grid-cols-3 gap-2">{(["going","maybe","declined"] as Rsvp[]).map((option)=><button key={option} onClick={()=>onRsvp(option)} className={`rounded-full px-3 py-2 text-xs font-semibold capitalize ${status===option?"bg-navy text-white":"border border-line text-muted hover:border-navy hover:text-navy"}`}>{option === "declined" ? "Can’t make it" : option}</button>)}</div>{atCap && status !== "going" ? <button onClick={()=>onRsvp("waitlist")} className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy">Join waitlist</button> : <button onClick={()=>onRsvp(status === "going" ? "declined" : "going")} className="flex w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white">{status === "going" ? <><Check size={16}/> You’re going</> : "RSVP going"}</button>}<a href={addToGoogleCalendarUrl(event)} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-semibold text-navy hover:bg-slate-50"><CalendarPlus size={16}/> Add to Google Calendar</a></div></div>; }

function GoogleCalendarPanel() {
  const calendarId = GOOGLE_CALENDAR_ID.trim();
  if (!calendarId) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
        <CalendarDays className="mx-auto text-muted" size={30} />
        <p className="mt-3 text-sm font-semibold text-ink">Google Calendar not connected yet</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">Paste the chapter&rsquo;s <span className="font-medium text-ink">public</span> Google Calendar ID into <code className="rounded bg-slate-100 px-1.5 py-0.5">src/data/calendar.ts</code>. The calendar must be shared publicly, or the embed shows nothing.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="relative h-[70vh] min-h-[520px] w-full">
        <iframe title="Chapter Google Calendar" src={googleCalendarEmbedSrc(calendarId)} className="absolute inset-0 h-full w-full border-0" loading="lazy" />
      </div>
    </div>
  );
}

function CreateEvent({onClose,onCreate}:{onClose:()=>void;onCreate:(event:ChapterEvent)=>void}) { const [title,setTitle]=useState("");const [date,setDate]=useState("2026-08-05T18:00");const [type,setType]=useState<EventType>("general");const [location,setLocation]=useState("");const [visibility,setVisibility]=useState<ChapterEvent["visibility"]>("members"); function submit(e:React.FormEvent){e.preventDefault();if(!title.trim())return;onCreate({id:`local-${Date.now()}`,title,start:date,location:location||"Location TBA",type,description:"Details will be shared with attendees.",going:0,requiresRsvp:true,visibility});}return <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] grid place-items-center bg-navy/50 p-5"><motion.form initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}} onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-ink">Create event</h2><p className="text-sm text-muted">America/New_York timezone</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-slate-100"><X size={18}/></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-medium text-ink">Title<input required value={title} onChange={(e)=>setTitle(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-navy" placeholder="Event title"/></label><label className="text-sm font-medium text-ink">Start date & time<input type="datetime-local" value={date} onChange={(e)=>setDate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-navy"/></label><label className="text-sm font-medium text-ink">Event type<select value={type} onChange={(e)=>setType(e.target.value as EventType)} className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-normal outline-none focus:border-navy">{TYPES.map(t=><option key={t} value={t}>{EVENT_TYPE_META[t].label}</option>)}</select></label><label className="sm:col-span-2 text-sm font-medium text-ink">Location<input value={location} onChange={(e)=>setLocation(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-navy" placeholder="Location or virtual link"/></label><label className="sm:col-span-2 text-sm font-medium text-ink">Visibility<select value={visibility} onChange={(e)=>setVisibility(e.target.value as ChapterEvent["visibility"])} className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-normal outline-none focus:border-navy"><option value="members">All members</option><option value="active">Active only</option><option value="pledge">Pledge only</option><option value="eboard">E-Board only</option></select></label></div><button className="mt-6 w-full rounded-full bg-navy py-3 text-sm font-semibold text-white hover:bg-navy/90">Create event</button></motion.form></motion.div>; }
