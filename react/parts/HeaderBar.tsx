import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faArrowsRotate,
  faCalendar,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '../../libs/utils/cn';
import type { View, CalendarMessages } from '../../modules/calendar/calendar.types';

type HeaderBarProps = {
  label: string;
  view: View;
  onViewChange: (v: View) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  messages: CalendarMessages;
  className?: string;
};

const VIEWS: View[] = ['month', 'week', 'day', 'agenda', 'resource'];

export function HeaderBar({
  label,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  messages,
  className,
}: HeaderBarProps) {
  const viewLabel: Record<View, string> = {
    month: messages.month,
    week: messages.week,
    day: messages.day,
    agenda: messages.agenda,
    resource: messages.resource,
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 px-3 py-2.5',
        'border-b border-border bg-surface-raised',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToday}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium',
            'border border-border bg-surface-base text-text-primary',
            'hover:bg-surface-overlay transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
          )}
          aria-label={messages.today}
        >
          <FontAwesomeIcon icon={faArrowsRotate} className="w-3 h-3" aria-hidden="true" />
          <span>{messages.today}</span>
        </button>

        <div className="inline-flex items-center rounded-md border border-border bg-surface-base">
          <button
            type="button"
            onClick={onPrev}
            aria-label={messages.previous}
            className={cn(
              'inline-flex items-center justify-center w-8 h-8 rounded-l-md',
              'text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
            )}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label={messages.next}
            className={cn(
              'inline-flex items-center justify-center w-8 h-8 rounded-r-md border-l border-border',
              'text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
            )}
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-text-primary">
        <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5 text-text-secondary" aria-hidden="true" />
        <h2 className="text-base font-semibold tabular-nums">{label}</h2>
      </div>

      <div
        role="tablist"
        aria-label="Calendar view"
        className="inline-flex items-center rounded-md border border-border bg-surface-base p-0.5"
      >
        {VIEWS.map((v) => {
          const active = v === view;
          return (
            <button
              key={v}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => onViewChange(v)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                active
                  ? 'bg-primary text-primary-fg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay',
              )}
            >
              {viewLabel[v]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
