import { cn } from '../../libs/utils/cn';
import { EVENT_COLOR_CLASSES } from '../../modules/calendar/calendar.colors';
import { useCalStore } from '../hooks/useCalStore';
import type { CalendarMessages } from '../../modules/calendar/calendar.types';

type CalendarLegendProps = {
  messages: CalendarMessages;
  onToggle?: (calendarId: string, visible: boolean) => void;
  className?: string;
};

export function CalendarLegend({ messages, onToggle, className }: CalendarLegendProps) {
  const calendars = useCalStore((s) => s.calendars);
  const hidden = useCalStore((s) => s.hiddenCalendarIds);
  const toggleCalendar = useCalStore((s) => s.toggleCalendar);

  if (!calendars.length) return null;

  return (
    <div
      role="group"
      aria-label={messages.calendars}
      className={cn(
        'flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-border bg-surface-base',
        className,
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mr-1">
        {messages.calendars}
      </span>
      {calendars.map((cal) => {
        const isHidden = hidden.has(cal.id);
        const dot = EVENT_COLOR_CLASSES[cal.color].dot;
        return (
          <button
            key={cal.id}
            type="button"
            role="switch"
            aria-checked={!isHidden}
            onClick={() => {
              toggleCalendar(cal.id);
              onToggle?.(cal.id, isHidden);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
              'border border-border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
              isHidden
                ? 'bg-surface-raised text-text-disabled line-through'
                : 'bg-surface-base text-text-primary hover:bg-surface-overlay',
            )}
          >
            <span className={cn('w-2.5 h-2.5 rounded-full', dot, isHidden && 'opacity-30')} aria-hidden="true" />
            <span>{cal.name}</span>
          </button>
        );
      })}
    </div>
  );
}
