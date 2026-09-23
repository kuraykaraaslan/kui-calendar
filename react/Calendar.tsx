import { useEffect, useMemo, useRef, useCallback } from 'react';
import { cn } from '../libs/utils/cn.js';
import type { CalendarProps, View } from '../modules/calendar/calendar.types.js';
import { CalendarEngine } from '../modules/calendar/calendar.engine.js';
import { addDays, addMonths, periodLabel, visibleWindow } from '../modules/calendar/calendar.date-utils.js';
import { resolveLocale, mergeMessages } from '../modules/calendar/locale/index.js';
import { CalendarEngineContext } from './CalendarEngineContext.js';
import { useCalStore } from './hooks/useCalStore.js';
import { useKeyboardNav } from './hooks/useKeyboardNav.js';
import { useRecurrence } from './hooks/useRecurrence.js';
import { HeaderBar } from './parts/HeaderBar.js';
import { EventPopover } from './parts/EventPopover.js';
import { CalendarLegend } from './parts/CalendarLegend.js';
import { LiveRegion } from './parts/LiveRegion.js';
import { MonthView } from './views/MonthView.js';
import { WeekView } from './views/WeekView.js';
import { DayView } from './views/DayView.js';
import { AgendaView } from './views/AgendaView.js';
import { ResourceView } from './views/ResourceView.js';

export function Calendar(props: CalendarProps) {
  const engineRef = useRef<CalendarEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new CalendarEngine({
      date: props.defaultDate ?? new Date(),
      view: props.view ?? 'month',
      locale: props.locale,
      messages: props.messages,
    });
  }

  useEffect(() => {
    if (props.view) engineRef.current?.setView(props.view);
  }, [props.view]);

  return (
    <CalendarEngineContext.Provider value={engineRef.current}>
      <CalendarInner {...props} />
    </CalendarEngineContext.Provider>
  );
}

function CalendarInner({
  events,
  view = 'month',
  onViewChange,
  onDateChange,
  onEventClick,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  locale,
  messages: messageOverrides,
  workingHours,
  slotMinutes = 30,
  resources,
  calendars,
  onCalendarToggle,
  hideCalendarLegend,
  recurrence = false,
  onTelemetry,
  className,
}: CalendarProps) {
  const date = useCalStore((s) => s.date);
  const setStoreDate = useCalStore((s) => s.setDate);
  const openPopover = useCalStore((s) => s.openPopover);
  const setCalendars = useCalStore((s) => s.setCalendars);
  const hiddenCalendarIds = useCalStore((s) => s.hiddenCalendarIds);

  useEffect(() => {
    setCalendars(calendars ?? []);
  }, [calendars, setCalendars]);

  const localeBundle = useMemo(() => resolveLocale(locale), [locale]);

  const messages = useMemo(
    () => mergeMessages(localeBundle.messages, messageOverrides),
    [localeBundle, messageOverrides],
  );

  const today = useMemo(() => new Date(), []);
  const rootRef = useRef<HTMLDivElement>(null);

  const [windowStart, windowEnd] = useMemo(
    () => visibleWindow(view, date, localeBundle.weekStart),
    [view, date, localeBundle.weekStart],
  );

  // RRULE expansion is opt-in via the `recurrence` prop (default off).
  const expanded = useRecurrence(events, windowStart, windowEnd, recurrence);
  const visibleEvents = useMemo(() => {
    if (!hiddenCalendarIds.size) return expanded;
    return expanded.filter((e) => !e.calendarId || !hiddenCalendarIds.has(e.calendarId));
  }, [expanded, hiddenCalendarIds]);

  const label = useMemo(
    () => periodLabel(view, date, localeBundle.monthNames, localeBundle.weekStart),
    [view, date, localeBundle.monthNames, localeBundle.weekStart],
  );

  const setDate = useCallback(
    (next: Date, direction: 'prev' | 'next' | 'today') => {
      setStoreDate(next);
      onDateChange?.(next);
      onTelemetry?.({ type: 'nav', date: next, direction });
    },
    [setStoreDate, onDateChange, onTelemetry],
  );

  // 'day' and 'resource' (a single day) both fall through to one-day steps.
  const goPrev = useCallback(() => {
    if (view === 'month' || view === 'agenda') {
      setDate(addMonths(date, -1), 'prev');
    } else if (view === 'week') {
      setDate(addDays(date, -7), 'prev');
    } else {
      setDate(addDays(date, -1), 'prev');
    }
  }, [view, date, setDate]);

  const goNext = useCallback(() => {
    if (view === 'month' || view === 'agenda') {
      setDate(addMonths(date, 1), 'next');
    } else if (view === 'week') {
      setDate(addDays(date, 7), 'next');
    } else {
      setDate(addDays(date, 1), 'next');
    }
  }, [view, date, setDate]);

  const goToday = useCallback(() => {
    setDate(new Date(), 'today');
  }, [setDate]);

  const stepDays = useCallback(
    (delta: number) => {
      setDate(addDays(date, delta), delta < 0 ? 'prev' : 'next');
    },
    [date, setDate],
  );

  const handleViewChange = useCallback(
    (v: View) => {
      onViewChange?.(v);
      onTelemetry?.({ type: 'view-change', view: v });
    },
    [onViewChange, onTelemetry],
  );

  const handleEventClick = useCallback(
    (event: Parameters<NonNullable<CalendarProps['onEventClick']>>[0], rect?: DOMRect) => {
      if (rect) openPopover(event, rect);
      onEventClick?.(event);
      onTelemetry?.({ type: 'event-click', eventId: event.id });
    },
    [openPopover, onEventClick, onTelemetry],
  );

  const handleCalendarToggle = useCallback(
    (calendarId: string, visible: boolean) => {
      onCalendarToggle?.(calendarId, visible);
      onTelemetry?.({ type: 'calendar-toggle', calendarId, visible });
    },
    [onCalendarToggle, onTelemetry],
  );

  useKeyboardNav({ rootRef, onPrev: goPrev, onNext: goNext, onToday: goToday, onStepDays: stepDays });

  const announcement = useMemo(() => messages.showing(label), [messages, label]);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      className={cn(
        'flex flex-col w-full rounded-lg border border-border bg-surface-base overflow-hidden',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
        className,
      )}
      aria-label="Calendar"
    >
      <HeaderBar
        label={label}
        view={view}
        onViewChange={handleViewChange}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        messages={messages}
      />

      {!hideCalendarLegend && calendars && calendars.length > 0 && (
        <CalendarLegend messages={messages} onToggle={handleCalendarToggle} />
      )}

      {view === 'month' && (
        <MonthView
          date={date}
          events={visibleEvents}
          locale={{ ...localeBundle, messages }}
          today={today}
          onEventClick={handleEventClick}
        />
      )}
      {view === 'week' && (
        <WeekView
          date={date}
          events={visibleEvents}
          locale={{ ...localeBundle, messages }}
          today={today}
          workingHours={workingHours}
          slotMinutes={slotMinutes}
          onEventClick={handleEventClick}
          onEventCreate={onEventCreate}
          onEventUpdate={onEventUpdate}
          onTelemetry={onTelemetry}
        />
      )}
      {view === 'day' && (
        <DayView
          date={date}
          events={visibleEvents}
          locale={{ ...localeBundle, messages }}
          today={today}
          workingHours={workingHours}
          slotMinutes={slotMinutes}
          onEventClick={handleEventClick}
          onEventCreate={onEventCreate}
          onEventUpdate={onEventUpdate}
          onTelemetry={onTelemetry}
        />
      )}
      {view === 'agenda' && (
        <AgendaView
          events={visibleEvents}
          locale={{ ...localeBundle, messages }}
          today={today}
          windowStart={windowStart}
          windowEnd={windowEnd}
          onEventClick={handleEventClick}
        />
      )}
      {view === 'resource' && (
        <ResourceView
          date={date}
          events={visibleEvents}
          resources={resources ?? []}
          locale={{ ...localeBundle, messages }}
          today={today}
          workingHours={workingHours}
          slotMinutes={slotMinutes}
          onEventClick={handleEventClick}
          onTelemetry={onTelemetry}
        />
      )}

      <EventPopover
        messages={messages}
        onEventUpdate={onEventUpdate}
        onEventDelete={onEventDelete}
        onTelemetry={onTelemetry}
      />

      <LiveRegion message={announcement} />
    </div>
  );
}
