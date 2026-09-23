import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import { cn } from '../../libs/utils/cn.js';
import { effectiveColor, EVENT_COLOR_CLASSES } from '../../modules/calendar/calendar.colors.js';
import { fmtTime, fmtTimeRange, isSameDay, startOfDay } from '../../modules/calendar/calendar.date-utils.js';
import { useCalStore } from '../hooks/useCalStore.js';
import type { CalendarEvent } from '../../modules/calendar/calendar.types.js';
import type { LocaleBundle } from '../../modules/calendar/locale/index.js';

type AgendaViewProps = {
  events: CalendarEvent[];
  locale: LocaleBundle;
  today: Date;
  windowStart: Date;
  windowEnd: Date;
  onEventClick?: (e: CalendarEvent, anchorRect: DOMRect) => void;
  className?: string;
};

type DayBucket = { date: Date; events: CalendarEvent[] };

function bucketByDay(events: CalendarEvent[], windowStart: Date, windowEnd: Date): DayBucket[] {
  const byKey = new Map<number, DayBucket>();
  const winStartMs = windowStart.getTime();
  const winEndMs = windowEnd.getTime();
  for (const e of events) {
    if (e.end.getTime() < winStartMs || e.start.getTime() > winEndMs) continue;
    const key = startOfDay(e.start).getTime();
    let bucket = byKey.get(key);
    if (!bucket) { bucket = { date: new Date(key), events: [] }; byKey.set(key, bucket); }
    bucket.events.push(e);
  }
  const arr = Array.from(byKey.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  for (const b of arr) b.events.sort((a, c) => a.start.getTime() - c.start.getTime());
  return arr;
}

export function AgendaView({ events, locale, today, windowStart, windowEnd, onEventClick, className }: AgendaViewProps) {
  const calendars = useCalStore((s) => s.calendars);
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) => e.title.toLowerCase().includes(q) || (e.description?.toLowerCase().includes(q) ?? false),
    );
  }, [events, query]);

  const buckets = useMemo(() => bucketByDay(visible, windowStart, windowEnd), [visible, windowStart, windowEnd]);

  return (
    <div role="region" aria-label={locale.messages.agenda} className={cn('flex flex-col w-full', className)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface-base">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={locale.messages.search}
            aria-label={locale.messages.search}
            className={cn(
              'w-full pl-8 pr-8 py-1.5 text-xs rounded-md',
              'border border-border bg-surface-base text-text-primary',
              'placeholder:text-text-disabled',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={locale.messages.close}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-5 h-5 rounded text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
            >
              <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[60vh]">
        {buckets.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-xs text-text-secondary">
            {locale.messages.noEvents}
          </div>
        ) : (
          buckets.map((b) => {
            const isToday = isSameDay(b.date, today);
            return (
              <section key={b.date.getTime()} className="border-b border-border last:border-b-0">
                <header className="flex items-baseline gap-2 px-3 py-2 bg-surface-raised border-b border-border">
                  <span className={cn(
                    'inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-xs font-semibold tabular-nums',
                    isToday ? 'bg-primary text-primary-fg' : 'bg-surface-overlay text-text-primary',
                  )}>
                    {b.date.getDate()}
                  </span>
                  <span className="text-xs font-semibold text-text-primary">{locale.dayLong[b.date.getDay()]}</span>
                  <span className="text-[11px] text-text-secondary tabular-nums">
                    {locale.monthNames[b.date.getMonth()]} {b.date.getFullYear()}
                  </span>
                </header>
                <ul className="flex flex-col">
                  {b.events.map((e) => {
                    const color = effectiveColor(e, calendars);
                    const dot = EVENT_COLOR_CLASSES[color].dot;
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={(ev) => onEventClick?.(e, (ev.currentTarget as HTMLElement).getBoundingClientRect())}
                          className={cn(
                            'flex items-center gap-3 w-full px-3 py-2 text-left',
                            'border-b border-border last:border-b-0 hover:bg-surface-overlay',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus',
                          )}
                        >
                          <span className={cn('w-2 h-2 rounded-full shrink-0', dot)} aria-hidden="true" />
                          <span className="text-[11px] tabular-nums text-text-secondary w-24 shrink-0">
                            {e.allDay ? locale.messages.allDay : fmtTimeRange(e.start, e.end)}
                          </span>
                          <span className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate">{e.title}</span>
                          {!e.allDay && (
                            <span className="text-[11px] tabular-nums text-text-disabled">{fmtTime(e.start)}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
