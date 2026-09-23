import { describe, expect, it, vi } from 'vitest';
import { createCalendarStore } from '../../modules/calendar/calendar.store';
import type { CalendarEvent } from '../../modules/calendar/calendar.types';

const date = new Date(2026, 8, 24);
const event: CalendarEvent = { id: 'e1', title: 'Standup', start: new Date(2026, 8, 24, 9), end: new Date(2026, 8, 24, 9, 30) };
const rect = { top: 10, left: 20, bottom: 30, right: 120, width: 100, height: 20 } as DOMRect;

describe('createCalendarStore', () => {
  it('starts from the given date and view with idle interaction state', () => {
    const s = createCalendarStore({ date, view: 'week' }).getState();
    expect(s.date).toBe(date);
    expect(s.view).toBe('week');
    expect(s.popover).toEqual({ event: null, anchorRect: null });
    expect(s.drag).toEqual({ kind: 'idle' });
    expect(s.calendars).toEqual([]);
    expect(s.hiddenCalendarIds.size).toBe(0);
  });

  it('gives each store its own state', () => {
    const a = createCalendarStore({ date, view: 'month' });
    const b = createCalendarStore({ date, view: 'month' });
    a.getState().toggleCalendar('work');
    a.getState().setView('day');
    expect(b.getState().hiddenCalendarIds.size).toBe(0);
    expect(b.getState().view).toBe('month');
  });

  it('sets date and view and notifies subscribers', () => {
    const store = createCalendarStore({ date, view: 'month' });
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    const next = new Date(2026, 9, 1);
    store.getState().setDate(next);
    store.getState().setView('agenda');
    expect(store.getState().date).toBe(next);
    expect(store.getState().view).toBe('agenda');
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    store.getState().setView('day');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('opens and closes the popover', () => {
    const store = createCalendarStore({ date, view: 'month' });
    store.getState().openPopover(event, rect);
    expect(store.getState().popover).toEqual({ event, anchorRect: rect });
    store.getState().closePopover();
    expect(store.getState().popover).toEqual({ event: null, anchorRect: null });
  });

  it('tracks drag state', () => {
    const store = createCalendarStore({ date, view: 'week' });
    const drag = { kind: 'create', ghostStart: event.start, ghostEnd: event.end, dayIndex: 2 } as const;
    store.getState().setDrag(drag);
    expect(store.getState().drag).toEqual(drag);
    store.getState().setDrag({ kind: 'idle' });
    expect(store.getState().drag.kind).toBe('idle');
  });

  it('toggles calendar visibility with a fresh Set each time (so selectors re-render)', () => {
    const store = createCalendarStore({ date, view: 'month' });
    store.getState().setCalendars([{ id: 'work', name: 'Work', color: 'info' }]);
    expect(store.getState().calendars).toHaveLength(1);

    const initial = store.getState().hiddenCalendarIds;
    store.getState().toggleCalendar('work');
    const hidden = store.getState().hiddenCalendarIds;
    expect(hidden).not.toBe(initial);
    expect(hidden.has('work')).toBe(true);
    expect(initial.has('work')).toBe(false);

    store.getState().toggleCalendar('work');
    expect(store.getState().hiddenCalendarIds.has('work')).toBe(false);
    expect(store.getState().hiddenCalendarIds).not.toBe(hidden);
  });
});
