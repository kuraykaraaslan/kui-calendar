import { cn } from '../../libs/utils/cn';
import type { CalendarTelemetry, CalendarEvent, WorkingHours } from '../../modules/calendar/calendar.types';
import { effectiveColor, EVENT_COLOR_CLASSES } from '../../modules/calendar/calendar.colors';
import {
  fmtTime,
  HOUR_HEIGHT,
  isSameDay,
  MIN_EVENT_HEIGHT,
  minutesIntoDay,
} from '../../modules/calendar/calendar.date-utils';
import { useCalStore } from '../hooks/useCalStore';
import { useDragMove } from '../hooks/useDragMove';
import { useResize } from '../hooks/useResize';
import { useDragCreate } from '../hooks/useDragCreate';

type TimeGridProps = {
  days: Date[];
  events: CalendarEvent[];
  workingHours?: WorkingHours;
  slotMinutes?: 5 | 15 | 30 | 60;
  onEventClick?: (e: CalendarEvent, anchorRect: DOMRect) => void;
  onEventCreate?: (range: { start: Date; end: Date }) => void | Promise<void>;
  onEventUpdate?: (event: CalendarEvent) => void | Promise<void>;
  onTelemetry?: (e: CalendarTelemetry) => void;
};

function eventTop(start: Date) {
  return (minutesIntoDay(start) / 60) * HOUR_HEIGHT;
}

function eventHeight(start: Date, end: Date) {
  const startMin = minutesIntoDay(start);
  const endMin = Math.min(24 * 60, minutesIntoDay(end) || 24 * 60);
  return Math.max(MIN_EVENT_HEIGHT, ((endMin - startMin) / 60) * HOUR_HEIGHT);
}

export function TimeGrid({
  days,
  events,
  workingHours,
  slotMinutes = 30,
  onEventClick,
  onEventCreate,
  onEventUpdate,
  onTelemetry,
}: TimeGridProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const totalHeight = 24 * HOUR_HEIGHT;

  const drag = useCalStore((s) => s.drag);
  const calendars = useCalStore((s) => s.calendars);
  const moveDownFor = useDragMove({ days, slotMinutes, onEventUpdate, onTelemetry });
  const resizeDownFor = useResize({ slotMinutes, onEventUpdate, onTelemetry });
  const createDownFor = useDragCreate({ days, slotMinutes, onEventCreate, onTelemetry });

  return (
    <div className="flex w-full overflow-x-auto" role="region" aria-label="Time grid">
      <div className="shrink-0 w-14 border-r border-border bg-surface-base">
        <div className="h-8" aria-hidden="true" />
        {hours.map((h) => (
          <div
            key={h}
            style={{ height: HOUR_HEIGHT }}
            className="text-[10px] text-text-secondary text-right pr-2 -mt-2 pt-0"
          >
            {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
          </div>
        ))}
      </div>

      <div className="flex-1 flex min-w-0">
        {days.map((day, dayIndex) => {
          const dayEvents = events.filter((e) => !e.allDay && isSameDay(e.start, day));
          const isWorkingDay = workingHours?.days.includes(day.getDay()) ?? true;

          const ghost = (() => {
            if (drag.kind === 'create' && drag.dayIndex === dayIndex) {
              return { top: eventTop(drag.ghostStart), height: eventHeight(drag.ghostStart, drag.ghostEnd), label: `${fmtTime(drag.ghostStart)} – ${fmtTime(drag.ghostEnd)}` };
            }
            if (drag.kind === 'move' && drag.dayIndex === dayIndex) {
              return { top: eventTop(drag.ghostStart), height: eventHeight(drag.ghostStart, drag.ghostEnd), label: `${fmtTime(drag.ghostStart)} – ${fmtTime(drag.ghostEnd)}` };
            }
            return null;
          })();

          return (
            <div
              key={day.toISOString()}
              data-cal-day-index={dayIndex}
              className="flex-1 min-w-0 border-r border-border last:border-r-0 relative"
            >
              <div className="h-8 border-b border-border bg-surface-raised flex items-center justify-center text-xs font-medium text-text-secondary" />

              <div
                className="relative touch-none select-none"
                style={{ height: totalHeight }}
                onPointerDown={createDownFor(dayIndex)}
              >
                {hours.map((h) => {
                  const inWorking =
                    isWorkingDay && workingHours && h >= workingHours.start && h < workingHours.end;
                  return (
                    <div
                      key={h}
                      style={{ height: HOUR_HEIGHT }}
                      className={cn('border-b border-border/60', inWorking ? 'bg-surface-base' : 'bg-surface-raised/60')}
                    />
                  );
                })}

                {dayEvents.map((e) => {
                  const isBeingMoved = drag.kind === 'move' && drag.eventId === e.id;
                  const isBeingResized = drag.kind === 'resize' && drag.eventId === e.id;
                  const liveStart = isBeingMoved && drag.dayIndex === dayIndex ? drag.ghostStart : e.start;
                  const liveEnd =
                    isBeingResized
                      ? drag.ghostEnd
                      : isBeingMoved && drag.dayIndex === dayIndex
                        ? drag.ghostEnd
                        : e.end;
                  if (isBeingMoved && drag.dayIndex !== dayIndex) return null;

                  const top = eventTop(liveStart);
                  const height = eventHeight(liveStart, liveEnd);
                  const color = effectiveColor(e, calendars);
                  const styles = EVENT_COLOR_CLASSES[color];
                  return (
                    <button
                      key={e.id}
                      type="button"
                      data-event-id={e.id}
                      aria-label={`${e.title} ${fmtTime(liveStart)} – ${fmtTime(liveEnd)}`}
                      onPointerDown={moveDownFor(e, dayIndex)}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onEventClick?.(e, (ev.currentTarget as HTMLElement).getBoundingClientRect());
                      }}
                      style={{ top, height, left: 4, right: 4 }}
                      className={cn(
                        'absolute rounded-md px-2 py-1 text-left text-[11px] leading-tight overflow-hidden cursor-grab active:cursor-grabbing',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                        styles.pill,
                        (isBeingMoved || isBeingResized) && 'opacity-60 ring-2 ring-border-focus',
                      )}
                    >
                      <div className="font-semibold truncate">{e.title}</div>
                      <div className="opacity-80 text-[10px] tabular-nums">
                        {fmtTime(liveStart)} – {fmtTime(liveEnd)}
                      </div>
                      {height >= 24 && (
                        <span
                          data-resize-handle
                          role="separator"
                          aria-label="Resize"
                          onPointerDown={resizeDownFor(e)}
                          className={cn(
                            'absolute left-1 right-1 bottom-0 h-1.5 rounded-b cursor-ns-resize',
                            'bg-transparent hover:bg-black/10',
                          )}
                        />
                      )}
                    </button>
                  );
                })}

                {ghost && (
                  <div
                    aria-hidden="true"
                    style={{ top: ghost.top, height: ghost.height, left: 4, right: 4 }}
                    className={cn(
                      'absolute rounded-md border-2 border-dashed border-primary bg-primary/15',
                      'pointer-events-none px-2 py-1 text-[11px] text-primary font-medium tabular-nums',
                    )}
                  >
                    {ghost.label}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
