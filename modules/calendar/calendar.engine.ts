import { createCalendarStore, type CalendarStore, type CalendarStoreApi } from './calendar.store';
import { resolveLocale, mergeMessages, type LocaleBundle } from './locale';
import {
  addDays,
  addMonths,
  visibleWindow,
  periodLabel,
} from './calendar.date-utils';
import { expandRRule, isException, parseRRule } from './calendar.rrule';
import type {
  CalendarEvent,
  EventOccurrence,
  View,
  CalendarSource,
  CalendarProps,
} from './calendar.types';

export type CalendarEngineOptions = {
  date?: Date;
  view?: View;
  locale?: string;
  messages?: Partial<CalendarProps['messages'] extends infer M ? NonNullable<M> : never>;
};

/**
 * Vanilla TypeScript core for the Calendar.
 * Holds the Zustand vanilla store + locale resolution.
 * Framework-agnostic — no React imports.
 *
 * Mirrors the role of the `Viewer` class in @kuraykaraaslan/kui-viewer.
 */
export class CalendarEngine {
  readonly store: CalendarStoreApi;
  readonly locale: LocaleBundle;

  constructor(opts: CalendarEngineOptions = {}) {
    this.store = createCalendarStore({
      date: opts.date ?? new Date(),
      view: opts.view ?? 'month',
    });
    this.locale = resolveLocale(opts.locale);
  }

  get state(): CalendarStore {
    return this.store.getState();
  }

  navigate(dir: 'prev' | 'next' | 'today'): void {
    const { date, view, setDate } = this.store.getState();
    if (dir === 'today') {
      setDate(new Date());
      return;
    }
    const delta = dir === 'prev' ? -1 : 1;
    if (view === 'month' || view === 'agenda') {
      setDate(addMonths(date, delta));
    } else if (view === 'week') {
      setDate(addDays(date, 7 * delta));
    } else {
      // 'day' and 'resource' (which renders a single day)
      setDate(addDays(date, delta));
    }
  }

  setView(view: View): void {
    this.store.getState().setView(view);
  }

  setEvents(_events: CalendarEvent[]): void {
    // Events are managed externally — this is a no-op placeholder
    // for imperative use cases (e.g. vanilla-only consumers).
  }

  setCalendars(calendars: CalendarSource[]): void {
    this.store.getState().setCalendars(calendars);
  }

  getPeriodLabel(): string {
    const { date, view } = this.store.getState();
    return periodLabel(view, date, this.locale.monthNames, this.locale.weekStart);
  }

  getVisibleWindow(): [Date, Date] {
    const { date, view } = this.store.getState();
    return visibleWindow(view, date, this.locale.weekStart);
  }

  expandOccurrences(events: CalendarEvent[]): EventOccurrence[] {
    const [windowStart, windowEnd] = this.getVisibleWindow();
    const out: EventOccurrence[] = [];
    for (const ev of events) {
      if (!ev.rrule) {
        out.push(ev);
        continue;
      }
      let parsed;
      try {
        parsed = parseRRule(ev.rrule);
      } catch {
        out.push(ev);
        continue;
      }
      const duration = ev.end.getTime() - ev.start.getTime();
      const occurrences = expandRRule(parsed, ev.start, windowStart, windowEnd);
      for (const start of occurrences) {
        if (isException(start, ev.exceptions)) continue;
        out.push({
          ...ev,
          id: `${ev.id}::${start.toISOString()}`,
          start,
          end: new Date(start.getTime() + duration),
          parentId: ev.id,
          originalStart: start,
          isRecurrence: true,
        });
      }
    }
    return out;
  }

  getMessages(overrides?: Partial<CalendarProps['messages'] extends infer M ? NonNullable<M> : never>) {
    return mergeMessages(this.locale.messages, overrides);
  }

  dispose(): void {
    // No async resources to clean up — here for API symmetry with kui-viewer.
  }
}
