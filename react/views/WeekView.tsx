import { cn } from '../../libs/utils/cn.js';
import type { CalendarTelemetry, CalendarEvent, WorkingHours } from '../../modules/calendar/calendar.types.js';
import { EventCard } from '../parts/EventCard.js';
import { TimeGrid } from '../parts/TimeGrid.js';
import { eventOnDay, isSameDay, rangeDays, startOfWeek } from '../../modules/calendar/calendar.date-utils.js';
import type { LocaleBundle } from '../../modules/calendar/locale/index.js';

type WeekViewProps = {
  date: Date;
  events: CalendarEvent[];
  locale: LocaleBundle;
  today: Date;
  workingHours?: WorkingHours;
  slotMinutes?: 5 | 15 | 30 | 60;
  onEventClick?: (e: CalendarEvent, anchorRect: DOMRect) => void;
  onEventCreate?: (range: { start: Date; end: Date }) => void | Promise<void>;
  onEventUpdate?: (event: CalendarEvent) => void | Promise<void>;
  onTelemetry?: (e: CalendarTelemetry) => void;
};

export function WeekView({
  date, events, locale, today, workingHours, slotMinutes,
  onEventClick, onEventCreate, onEventUpdate, onTelemetry,
}: WeekViewProps) {
  const start = startOfWeek(date, locale.weekStart);
  const days = rangeDays(start, 7);
  const allDayByDay = days.map((d) => events.filter((e) => e.allDay && eventOnDay(e, d)));
  const hasAllDay = allDayByDay.some((arr) => arr.length > 0);

  return (
    <div role="region" aria-label={`Week of ${days[0]?.toDateString()}`} className="flex flex-col w-full">
      <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-border bg-surface-raised">
        <div aria-hidden="true" />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={d.toISOString()} className={cn('px-2 py-2 text-center border-l border-border first:border-l-0')}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                {locale.dayShort[d.getDay()]}
              </div>
              <div
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold tabular-nums mt-0.5',
                  isToday ? 'bg-primary text-primary-fg' : 'text-text-primary',
                )}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {hasAllDay && (
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-border bg-surface-base">
          <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary text-right border-r border-border">
            {locale.messages.allDay}
          </div>
          {days.map((d, i) => (
            <div key={d.toISOString()} className="border-l border-border first:border-l-0 p-1 flex flex-col gap-0.5 min-h-[28px]">
              {allDayByDay[i]?.map((e) => (
                <EventCard key={e.id} event={e} variant="bar" onClick={onEventClick} />
              ))}
            </div>
          ))}
        </div>
      )}

      <TimeGrid
        days={days}
        events={events}
        workingHours={workingHours}
        slotMinutes={slotMinutes}
        onEventClick={onEventClick}
        onEventCreate={onEventCreate}
        onEventUpdate={onEventUpdate}
        onTelemetry={onTelemetry}
      />
    </div>
  );
}
