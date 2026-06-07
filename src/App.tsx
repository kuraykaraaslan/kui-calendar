import { useState } from 'react';
import { Calendar } from '../react';
import type { CalendarEvent, View } from '../react';

const today = new Date();
const d = (offsetDays: number, h: number, m: number) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays, h, m);

const SAMPLE_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Team standup', start: d(0, 9, 0), end: d(0, 9, 30), color: 'primary' },
  { id: '2', title: 'Design review', start: d(0, 14, 0), end: d(0, 15, 0), color: 'secondary' },
  { id: '3', title: 'Sprint planning', start: d(1, 10, 0), end: d(1, 12, 0), color: 'info' },
  { id: '4', title: 'All-hands', start: d(2, 16, 0), end: d(2, 17, 0), color: 'warning', allDay: false },
  { id: '5', title: 'Conference', start: d(3, 0, 0), end: d(5, 0, 0), allDay: true, color: 'success' },
  {
    id: '6',
    title: 'Weekly sync (recurring)',
    start: d(-7, 10, 0),
    end: d(-7, 10, 30),
    color: 'primary',
    rrule: 'FREQ=WEEKLY;BYDAY=MO',
  },
];

export default function App() {
  const [view, setView] = useState<View>('month');

  return (
    <div className="min-h-screen bg-surface-base p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          @kuraykaraaslan/kui-calendar — dev
        </h1>
        <Calendar
          events={SAMPLE_EVENTS}
          view={view}
          onViewChange={setView}
          workingHours={{ start: 9, end: 18, days: [1, 2, 3, 4, 5] }}
          slotMinutes={30}
          recurrence
        />
      </div>
    </div>
  );
}
