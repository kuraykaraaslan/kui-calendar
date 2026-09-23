import { cn } from '../../libs/utils/cn.js';
import { effectiveColor, EVENT_COLOR_CLASSES } from '../../modules/calendar/calendar.colors.js';
import {
  fmtTime,
  HOUR_HEIGHT,
  isSameDay,
  MIN_EVENT_HEIGHT,
  minutesIntoDay,
} from '../../modules/calendar/calendar.date-utils.js';
import { useCalStore } from '../hooks/useCalStore.js';
import type { CalendarTelemetry, CalendarEvent, Resource, WorkingHours } from '../../modules/calendar/calendar.types.js';
import type { LocaleBundle } from '../../modules/calendar/locale/index.js';

type ResourceViewProps = {
  date: Date;
  events: CalendarEvent[];
  resources: Resource[];
  locale: LocaleBundle;
  today: Date;
  workingHours?: WorkingHours;
  slotMinutes?: 5 | 15 | 30 | 60;
  onEventClick?: (e: CalendarEvent, anchorRect: DOMRect) => void;
  onTelemetry?: (e: CalendarTelemetry) => void;
};

export function ResourceView({ date, events, resources, locale, today, workingHours, onEventClick }: ResourceViewProps) {
  const calendars = useCalStore((s) => s.calendars);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const totalHeight = 24 * HOUR_HEIGHT;
  const isToday = isSameDay(date, today);
  const isWorkingDay = workingHours?.days.includes(date.getDay()) ?? true;

  if (!resources.length) {
    return (
      <div role="region" aria-label={locale.messages.resource} className="flex flex-col items-center justify-center gap-2 py-16 px-4 text-center">
        <p className="text-sm font-medium text-text-primary">{locale.messages.resource}</p>
        <p className="text-xs text-text-secondary">{locale.messages.noResources}</p>
      </div>
    );
  }

  const buckets = new Map<string, CalendarEvent[]>();
  for (const r of resources) buckets.set(r.id, []);
  const unassigned: CalendarEvent[] = [];
  for (const e of events) {
    if (e.allDay || !isSameDay(e.start, date)) continue;
    const key = e.resourceId ?? '';
    if (!key) { unassigned.push(e); continue; }
    const arr = buckets.get(key);
    if (arr) arr.push(e); else unassigned.push(e);
  }
  const lanes: { id: string; label: string; events: CalendarEvent[] }[] = [];
  if (unassigned.length) lanes.push({ id: '', label: '—', events: unassigned });
  for (const r of resources) lanes.push({ id: r.id, label: r.name, events: buckets.get(r.id) ?? [] });

  const conflicts = new Set<string>();
  for (const lane of lanes) {
    for (let i = 0; i < lane.events.length; i++) {
      for (let j = i + 1; j < lane.events.length; j++) {
        const a = lane.events[i]!, b = lane.events[j]!;
        if (a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
  }

  return (
    <div
      role="region"
      aria-label={`${locale.messages.resource} — ${locale.dayLong[date.getDay()]} ${date.getDate()} ${locale.monthNames[date.getMonth()]}`}
      className="flex flex-col w-full"
    >
      <div
        className="grid border-b border-border bg-surface-raised"
        style={{ gridTemplateColumns: `3.5rem repeat(${lanes.length}, minmax(0, 1fr))` }}
      >
        <div className="px-2 py-2 text-center">
          <span className={cn(
            'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold tabular-nums',
            isToday ? 'bg-primary text-primary-fg' : 'text-text-primary',
          )}>
            {date.getDate()}
          </span>
        </div>
        {lanes.map((lane) => (
          <div
            key={lane.id || '_unassigned'}
            className="px-2 py-2 text-center border-l border-border text-[11px] font-semibold uppercase tracking-wider text-text-secondary truncate"
            title={lane.label}
          >
            {lane.label}
          </div>
        ))}
      </div>

      <div className="flex w-full overflow-x-auto" role="region" aria-label="Time grid">
        <div className="shrink-0 w-14 border-r border-border bg-surface-base">
          <div className="h-0" aria-hidden="true" />
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="text-[10px] text-text-secondary text-right pr-2 -mt-2 pt-0">
              {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        <div className="flex-1 flex min-w-0">
          {lanes.map((lane) => (
            <div key={lane.id || '_unassigned'} className="flex-1 min-w-0 border-r border-border last:border-r-0 relative">
              <div className="relative" style={{ height: totalHeight }}>
                {hours.map((h) => {
                  const inWorking = isWorkingDay && workingHours && h >= workingHours.start && h < workingHours.end;
                  return (
                    <div key={h} style={{ height: HOUR_HEIGHT }} className={cn('border-b border-border/60', inWorking ? 'bg-surface-base' : 'bg-surface-raised/60')} />
                  );
                })}

                {lane.events.map((e) => {
                  const startMin = minutesIntoDay(e.start);
                  const endMin = Math.min(24 * 60, minutesIntoDay(e.end) || 24 * 60);
                  const top = (startMin / 60) * HOUR_HEIGHT;
                  const height = Math.max(MIN_EVENT_HEIGHT, ((endMin - startMin) / 60) * HOUR_HEIGHT);
                  const color = effectiveColor(e, calendars);
                  const styles = EVENT_COLOR_CLASSES[color];
                  const isConflict = conflicts.has(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      data-event-id={e.id}
                      aria-label={`${e.title} ${fmtTime(e.start)} – ${fmtTime(e.end)}`}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onEventClick?.(e, (ev.currentTarget as HTMLElement).getBoundingClientRect());
                      }}
                      style={{ top, height, left: 4, right: 4 }}
                      className={cn(
                        'absolute rounded-md px-2 py-1 text-left text-[11px] leading-tight overflow-hidden',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                        styles.pill,
                        isConflict && 'ring-2 ring-error ring-offset-1 ring-offset-surface-base',
                      )}
                    >
                      <div className="font-semibold truncate">{e.title}</div>
                      <div className="opacity-80 text-[10px] tabular-nums">{fmtTime(e.start)} – {fmtTime(e.end)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
