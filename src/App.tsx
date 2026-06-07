import { useState } from "react";
import { Calendar } from "../react";
import type { CalendarEvent, View } from "../react";
import DemoShell from "./DemoShell";

const today = new Date();
const d = (offsetDays: number, h: number, m: number) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays, h, m);

const SAMPLE_EVENTS: CalendarEvent[] = [
  { id: "1", title: "Team standup", start: d(0, 9, 0), end: d(0, 9, 30), color: "primary" },
  { id: "2", title: "Design review", start: d(0, 14, 0), end: d(0, 15, 0), color: "secondary" },
  { id: "3", title: "Sprint planning", start: d(1, 10, 0), end: d(1, 12, 0), color: "info" },
  { id: "4", title: "All-hands", start: d(2, 16, 0), end: d(2, 17, 0), color: "warning", allDay: false },
  { id: "5", title: "Conference", start: d(3, 0, 0), end: d(5, 0, 0), allDay: true, color: "success" },
  {
    id: "6",
    title: "Weekly sync (recurring)",
    start: d(-7, 10, 0),
    end: d(-7, 10, 30),
    color: "primary",
    rrule: "FREQ=WEEKLY;BYDAY=MO",
  },
];

const VIEWS: { id: View; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
];

const LEGEND: { color: string; label: string }[] = [
  { color: "bg-primary", label: "Meetings" },
  { color: "bg-secondary", label: "Reviews" },
  { color: "bg-info", label: "Planning" },
  { color: "bg-warning", label: "All-hands" },
  { color: "bg-success", label: "Out of office" },
];

export default function App() {
  const [view, setView] = useState<View>("month");

  const sidebar = (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Views</div>
        <div className="flex flex-col gap-1">
          {VIEWS.map((v) => {
            const active = v.id === view;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-primary-subtle text-primary"
                    : "text-text-primary hover:bg-surface-overlay"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Legend</div>
        <div className="flex flex-col gap-2">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-2.5 text-[12.5px] text-text-secondary">
              <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <DemoShell
      brand="KUI Calendar"
      version="v0.0.1"
      link={{ href: "https://kuray.dev", label: "kuray.dev" }}
      sidebarTitle="Calendar"
      sidebarCount={`${SAMPLE_EVENTS.length} events`}
      sidebar={sidebar}
      status={{ tone: "ready", text: `${SAMPLE_EVENTS.length} events loaded`, meta: `${view} view` }}
      stageClassName="p-4"
    >
      <Calendar
        events={SAMPLE_EVENTS}
        view={view}
        onViewChange={setView}
        workingHours={{ start: 9, end: 18, days: [1, 2, 3, 4, 5] }}
        slotMinutes={30}
        recurrence
      />
    </DemoShell>
  );
}
