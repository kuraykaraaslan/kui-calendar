import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '../../libs/utils/cn.js';
import type { CalendarEvent } from '../../modules/calendar/calendar.types.js';
import { effectiveColor, EVENT_COLOR_CLASSES } from '../../modules/calendar/calendar.colors.js';
import { useCalStore } from '../hooks/useCalStore.js';
import { fmtTime } from '../../modules/calendar/calendar.date-utils.js';

type Variant = 'pill' | 'bar' | 'stack';

type EventCardProps = {
  event: CalendarEvent;
  variant?: Variant;
  onClick?: (e: CalendarEvent, anchorRect: DOMRect) => void;
  className?: string;
};

export function EventCard({ event, variant = 'pill', onClick, className }: EventCardProps) {
  const calendars = useCalStore((s) => s.calendars);
  const color = effectiveColor(event, calendars);
  const styles = EVENT_COLOR_CLASSES[color];
  const time = !event.allDay ? fmtTime(event.start) : null;

  const ariaLabel = event.allDay
    ? `${event.title} (all-day)`
    : `${event.title} — ${fmtTime(event.start)} to ${fmtTime(event.end)}`;

  return (
    <button
      type="button"
      onClick={(e) => onClick?.(event, (e.currentTarget as HTMLElement).getBoundingClientRect())}
      aria-label={ariaLabel}
      data-event-id={event.id}
      className={cn(
        'flex items-center gap-1.5 w-full text-left truncate rounded-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
        'transition-colors',
        variant === 'pill' && 'px-1.5 py-0.5 text-[11px] leading-tight',
        variant === 'bar' && 'px-2 py-1 text-xs font-medium',
        variant === 'stack' && 'px-2 py-1.5 text-xs items-start flex-col gap-0.5',
        variant === 'bar' ? styles.bar : styles.pill,
        className,
      )}
    >
      {event.icon && (
        <FontAwesomeIcon
          icon={event.icon}
          className={cn('w-3 h-3 shrink-0', variant === 'stack' ? 'mt-0.5' : '')}
          aria-hidden="true"
        />
      )}
      {variant === 'stack' ? (
        <>
          <span className="font-semibold truncate w-full">{event.title}</span>
          {time && <span className="opacity-90 text-[10px]">{fmtTime(event.start)} – {fmtTime(event.end)}</span>}
        </>
      ) : (
        <>
          {time && <span className="opacity-90 tabular-nums shrink-0">{time}</span>}
          <span className="truncate">{event.title}</span>
        </>
      )}
    </button>
  );
}
