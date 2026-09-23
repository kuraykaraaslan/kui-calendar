import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarEngine } from '../../modules/calendar/calendar.engine';
import { fmtTime } from '../../modules/calendar/calendar.date-utils';
import type { CalendarEvent, View } from '../../modules/calendar/calendar.types';

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const fmt = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')} ${fmtTime(x)}`;

afterEach(() => { vi.useRealTimers(); });

describe('CalendarEngine — construction', () => {
  it('defaults to today, the month view and the Turkish locale', () => {
    vi.useFakeTimers();
    vi.setSystemTime(d(2026, 9, 24, 12));
    const engine = new CalendarEngine();
    expect(fmt(engine.state.date)).toBe('2026-09-24 12:00');
    expect(engine.state.view).toBe('month');
    expect(engine.locale.weekStart).toBe(1);
    expect(engine.locale.messages.today).toBe('Bugün');
  });

  it('accepts date, view and locale options', () => {
    const engine = new CalendarEngine({ date: d(2026, 1, 15), view: 'week', locale: 'en-US' });
    expect(fmt(engine.state.date)).toBe('2026-01-15 00:00');
    expect(engine.state.view).toBe('week');
    expect(engine.locale.weekStart).toBe(0);
    expect(engine.getPeriodLabel()).toBe('11 – 17 January 2026');
  });

  it('exposes the store for vanilla subscribers', () => {
    const engine = new CalendarEngine({ date: d(2026, 9, 24), locale: 'en' });
    const seen: View[] = [];
    const unsub = engine.store.subscribe((s) => seen.push(s.view));
    engine.setView('day');
    engine.setView('agenda');
    unsub();
    engine.setView('week');
    expect(seen).toEqual(['day', 'agenda']);
    expect(() => engine.dispose()).not.toThrow();
  });
});

describe('CalendarEngine.navigate', () => {
  const nav = (view: View, from: Date, dir: 'prev' | 'next') => {
    const engine = new CalendarEngine({ date: from, view, locale: 'en' });
    engine.navigate(dir);
    return fmt(engine.state.date);
  };

  it('steps a month in month-scoped views', () => {
    for (const view of ['month', 'agenda'] as const) {
      expect(nav(view, d(2026, 9, 24), 'next')).toBe('2026-10-24 00:00');
      expect(nav(view, d(2026, 9, 24), 'prev')).toBe('2026-08-24 00:00');
    }
  });

  it('steps a day in the resource view, which renders a single day', () => {
    expect(nav('resource', d(2026, 9, 24), 'next')).toBe('2026-09-25 00:00');
    expect(nav('resource', d(2026, 9, 1), 'prev')).toBe('2026-08-31 00:00');
    expect(nav('resource', d(2026, 12, 31), 'next')).toBe('2027-01-01 00:00');
    const engine = new CalendarEngine({ date: d(2026, 9, 24), view: 'resource', locale: 'en' });
    expect(engine.getPeriodLabel()).toBe('24 September 2026');
    expect(engine.getVisibleWindow().map(fmt)).toEqual(['2026-09-24 00:00', '2026-09-24 23:59']);
  });

  it('steps a week in the week view and a day in the day view', () => {
    expect(nav('week', d(2026, 12, 29), 'next')).toBe('2027-01-05 00:00');
    expect(nav('week', d(2026, 3, 12, 9), 'prev')).toBe('2026-03-05 09:00');
    expect(nav('day', d(2026, 12, 31), 'next')).toBe('2027-01-01 00:00');
    expect(nav('day', d(2028, 3, 1), 'prev')).toBe('2028-02-29 00:00');
  });

  it('crosses year boundaries by month', () => {
    expect(nav('month', d(2026, 12, 10), 'next')).toBe('2027-01-10 00:00');
    expect(nav('month', d(2026, 1, 10), 'prev')).toBe('2025-12-10 00:00');
  });

  it('never skips a month when paging from the 31st', () => {
    // Regression: 31 January + 1 month used to land on 3 March.
    const engine = new CalendarEngine({ date: d(2026, 1, 31), view: 'month', locale: 'en' });
    engine.navigate('next');
    expect(engine.getPeriodLabel()).toBe('February 2026');
    engine.navigate('next');
    expect(engine.getPeriodLabel()).toBe('March 2026');
  });

  it('jumps to the current date for "today"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(d(2026, 9, 24, 8, 15));
    const engine = new CalendarEngine({ date: d(2020, 1, 1), view: 'week', locale: 'en' });
    engine.navigate('today');
    expect(fmt(engine.state.date)).toBe('2026-09-24 08:15');
    expect(engine.state.view).toBe('week');
  });
});

describe('CalendarEngine — labels and windows', () => {
  it('builds period labels in the engine locale', () => {
    const engine = new CalendarEngine({ date: d(2026, 9, 24), view: 'month', locale: 'tr' });
    expect(engine.getPeriodLabel()).toBe('Eylül 2026');
    engine.setView('week');
    expect(engine.getPeriodLabel()).toBe('21 – 27 Eylül 2026');
    engine.setView('day');
    expect(engine.getPeriodLabel()).toBe('24 Eylül 2026');
  });

  it('computes the visible window with the locale week start', () => {
    const en = new CalendarEngine({ date: d(2026, 9, 24), view: 'week', locale: 'en' });
    const tr = new CalendarEngine({ date: d(2026, 9, 24), view: 'week', locale: 'tr' });
    expect(fmt(en.getVisibleWindow()[0])).toBe('2026-09-20 00:00');
    expect(fmt(tr.getVisibleWindow()[0])).toBe('2026-09-21 00:00');
  });

  it('merges message overrides over the locale bundle', () => {
    const engine = new CalendarEngine({ locale: 'en' });
    const msgs = engine.getMessages({ today: 'Now' });
    expect(msgs.today).toBe('Now');
    expect(msgs.next).toBe('Next');
    expect(engine.getMessages()).toBe(engine.locale.messages);
  });

  it('stores calendar sources', () => {
    const engine = new CalendarEngine();
    engine.setCalendars([{ id: 'a', name: 'A', color: 'success' }]);
    expect(engine.state.calendars).toEqual([{ id: 'a', name: 'A', color: 'success' }]);
    expect(() => engine.setEvents([])).not.toThrow();
  });
});

describe('CalendarEngine.expandOccurrences', () => {
  const engine = new CalendarEngine({ date: d(2026, 9, 24), view: 'week', locale: 'en' });
  // Week of Sun 20 – Sat 26 September 2026

  it('passes non-recurring events through untouched', () => {
    const ev: CalendarEvent = { id: 'one', title: 'One-off', start: d(2026, 9, 22, 10), end: d(2026, 9, 22, 11) };
    expect(engine.expandOccurrences([ev])).toEqual([ev]);
  });

  it('passes events with an invalid RRULE through as a single event', () => {
    const ev: CalendarEvent = { id: 'bad', title: 'Bad', start: d(2026, 9, 22, 10), end: d(2026, 9, 22, 11), rrule: 'FREQ=SECONDLY' };
    expect(engine.expandOccurrences([ev])).toEqual([ev]);
  });

  it('expands a recurring event into occurrences inside the visible window', () => {
    const ev: CalendarEvent = {
      id: 'sync',
      title: 'Sync',
      start: d(2026, 9, 1, 10),
      end: d(2026, 9, 1, 10, 45),
      rrule: 'FREQ=WEEKLY;BYDAY=MO,WE',
      calendarId: 'work',
    };
    const out = engine.expandOccurrences([ev]);
    expect(out.map((o) => fmt(o.start))).toEqual(['2026-09-21 10:00', '2026-09-23 10:00']);
    for (const o of out) {
      expect(o.end.getTime() - o.start.getTime()).toBe(45 * 60_000);
      expect(o.parentId).toBe('sync');
      expect(o.isRecurrence).toBe(true);
      expect(o.originalStart).toEqual(o.start);
      expect(o.id).toBe(`sync::${o.start.toISOString()}`);
      expect(o.calendarId).toBe('work');
    }
    expect(new Set(out.map((o) => o.id)).size).toBe(out.length);
  });

  it('drops occurrences listed as exceptions', () => {
    const ev: CalendarEvent = {
      id: 'daily',
      title: 'Daily',
      start: d(2026, 9, 21, 9),
      end: d(2026, 9, 21, 9, 15),
      rrule: 'FREQ=DAILY;COUNT=5',
      exceptions: [d(2026, 9, 23)],
    };
    expect(engine.expandOccurrences([ev]).map((o) => fmt(o.start))).toEqual([
      '2026-09-21 09:00',
      '2026-09-22 09:00',
      '2026-09-24 09:00',
      '2026-09-25 09:00',
    ]);
  });

  it('follows the store when the view or date changes', () => {
    const e = new CalendarEngine({ date: d(2026, 9, 24), view: 'day', locale: 'en' });
    const ev: CalendarEvent = { id: 'd', title: 'D', start: d(2026, 9, 1, 9), end: d(2026, 9, 1, 10), rrule: 'FREQ=DAILY' };
    expect(e.expandOccurrences([ev])).toHaveLength(1);
    e.setView('week');
    expect(e.expandOccurrences([ev])).toHaveLength(7);
  });
});
