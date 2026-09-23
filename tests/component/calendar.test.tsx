import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { Calendar } from '../../react';
import { useCalendarEngine } from '../../react/hooks/useCalendarEngine';
import type { CalendarEvent, CalendarProps, View } from '../../modules';

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);

const standup: CalendarEvent = { id: 'e1', title: 'Standup', start: d(2026, 9, 24, 9), end: d(2026, 9, 24, 9, 30) };
const review: CalendarEvent = {
  id: 'e2',
  title: 'Design review',
  start: d(2026, 9, 22, 14),
  end: d(2026, 9, 22, 15),
  description: 'Bring mockups',
  calendarId: 'work',
};

function renderCal(props: Partial<CalendarProps> = {}) {
  return render(<Calendar events={[]} defaultDate={d(2026, 9, 24)} locale="en" {...props} />);
}

/** `view` is controlled — mirror how an app wires it. */
function Controlled({ initialView = 'month', ...props }: Partial<CalendarProps> & { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);
  return (
    <Calendar
      events={[]}
      defaultDate={d(2026, 9, 24)}
      locale="en"
      {...props}
      view={view}
      onViewChange={(v) => { setView(v); props.onViewChange?.(v); }}
    />
  );
}

const heading = () => screen.getByRole('heading', { level: 2 });
const root = () => screen.getByLabelText('Calendar');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(d(2026, 9, 24, 10));
});
afterEach(() => { vi.useRealTimers(); });

describe('<Calendar /> month view', () => {
  it('renders a 6-week grid with localised weekday headers', () => {
    renderCal();
    expect(heading()).toHaveTextContent('September 2026');
    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    );
  });

  it('starts the week on Monday for the Turkish locale', () => {
    renderCal({ locale: 'tr' });
    expect(heading()).toHaveTextContent('Eylül 2026');
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Pzt');
  });

  it('marks today and labels cells with their event count', () => {
    renderCal({ events: [standup] });
    const cell = screen.getByRole('gridcell', { name: 'Thursday 24 September, 1 event' });
    expect(cell).toHaveAttribute('aria-selected', 'true');
    expect(within(cell).getByRole('button', { name: 'Standup — 09:00 to 09:30' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: 'Friday 25 September, no events' })).toHaveAttribute('aria-selected', 'false');
  });

  it('shows a multi-day event on every day it spans, across the month boundary', () => {
    const trip: CalendarEvent = { id: 't', title: 'Trip', start: d(2026, 9, 29, 12), end: d(2026, 10, 2, 12), allDay: true };
    renderCal({ events: [trip] });
    expect(screen.getAllByRole('button', { name: 'Trip (all-day)' })).toHaveLength(4);
    expect(screen.getByRole('gridcell', { name: 'Friday 2 October, 1 event' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: 'Saturday 3 October, no events' })).toBeInTheDocument();
  });

  it('caps a busy day at three events and summarises the overflow', () => {
    const many = Array.from({ length: 5 }, (_, i): CalendarEvent => ({
      id: `m${i}`, title: `Meeting ${i}`, start: d(2026, 9, 24, 9 + i), end: d(2026, 9, 24, 10 + i),
    }));
    renderCal({ events: many });
    const cell = screen.getByRole('gridcell', { name: 'Thursday 24 September, 5 events' });
    expect(within(cell).getAllByRole('button')).toHaveLength(3);
    expect(within(cell).getByText('+2 more')).toBeInTheDocument();
  });

  it('expands recurring events into the visible grid', () => {
    const weekly: CalendarEvent = {
      id: 'w', title: 'Weekly', start: d(2026, 9, 7, 10), end: d(2026, 9, 7, 11), rrule: 'FREQ=WEEKLY;BYDAY=MO',
    };
    renderCal({ events: [weekly] });
    // Mondays 7, 14, 21, 28 September and 5 October are all inside the grid.
    expect(screen.getAllByRole('button', { name: 'Weekly — 10:00 to 11:00' })).toHaveLength(5);
  });
});

describe('<Calendar /> navigation', () => {
  it('pages months with the header buttons and reports every move', () => {
    const onDateChange = vi.fn();
    const onTelemetry = vi.fn();
    renderCal({ onDateChange, onTelemetry });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(heading()).toHaveTextContent('October 2026');
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(heading()).toHaveTextContent('August 2026');

    expect(onDateChange).toHaveBeenCalledTimes(3);
    expect(onTelemetry).toHaveBeenLastCalledWith({ type: 'nav', date: expect.any(Date), direction: 'prev' });
  });

  it('does not skip February when paging from 31 January', () => {
    renderCal({ defaultDate: d(2026, 1, 31) });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(heading()).toHaveTextContent('February 2026');
  });

  it('returns to today', () => {
    const onDateChange = vi.fn();
    renderCal({ defaultDate: d(2025, 1, 1), onDateChange });
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(heading()).toHaveTextContent('September 2026');
    expect(onDateChange.mock.calls[0]![0]).toEqual(d(2026, 9, 24, 10));
  });

  it('supports keyboard navigation on the root', () => {
    const onDateChange = vi.fn();
    renderCal({ onDateChange });
    fireEvent.keyDown(root(), { key: 'PageDown' });
    expect(heading()).toHaveTextContent('October 2026');
    fireEvent.keyDown(root(), { key: 'PageUp' });
    fireEvent.keyDown(root(), { key: 'PageUp' });
    expect(heading()).toHaveTextContent('August 2026');
    fireEvent.keyDown(root(), { key: 't' });
    expect(heading()).toHaveTextContent('September 2026');

    // Arrow keys move by day / week: 24 Sep → +1 → +7 → 2 October → -1.
    fireEvent.keyDown(root(), { key: 'ArrowRight' });
    expect(heading()).toHaveTextContent('September 2026');
    fireEvent.keyDown(root(), { key: 'ArrowDown' });
    expect(heading()).toHaveTextContent('October 2026');
    fireEvent.keyDown(root(), { key: 'ArrowLeft' });
    expect(onDateChange).toHaveBeenLastCalledWith(d(2026, 10, 1, 10));
    fireEvent.keyDown(root(), { key: 'ArrowUp' });
    expect(onDateChange).toHaveBeenLastCalledWith(d(2026, 9, 24, 10));
  });

  it('ignores shortcuts with modifier keys', () => {
    const onDateChange = vi.fn();
    renderCal({ onDateChange });
    fireEvent.keyDown(root(), { key: 't', ctrlKey: true });
    fireEvent.keyDown(root(), { key: 'ArrowRight', metaKey: true });
    expect(onDateChange).not.toHaveBeenCalled();
  });

  it('announces the visible period in a polite live region', () => {
    renderCal();
    const regions = screen.getAllByRole('status');
    expect(regions.some((r) => r.textContent === 'Showing September 2026')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getAllByRole('status').some((r) => r.textContent === 'Showing October 2026')).toBe(true);
    for (const r of screen.getAllByRole('status')) expect(r).toHaveAttribute('aria-live', 'polite');
  });
});

describe('<Calendar /> views', () => {
  it('switches views through the tablist', () => {
    const onViewChange = vi.fn();
    const onTelemetry = vi.fn();
    render(<Controlled onViewChange={onViewChange} onTelemetry={onTelemetry} />);

    const tabs = within(screen.getByRole('tablist', { name: 'Calendar view' })).getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Month', 'Week', 'Day', 'Agenda', 'Resource']);
    expect(screen.getByRole('tab', { name: 'Month' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('tab', { name: 'Week' }));
    expect(onViewChange).toHaveBeenCalledWith('week');
    expect(onTelemetry).toHaveBeenCalledWith({ type: 'view-change', view: 'week' });
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveAttribute('aria-selected', 'true');
    expect(heading()).toHaveTextContent('20 – 26 September 2026');

    fireEvent.click(screen.getByRole('tab', { name: 'Day' }));
    expect(heading()).toHaveTextContent('24 September 2026');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(heading()).toHaveTextContent('25 September 2026');
  });

  it('pages a week at a time in the week view', () => {
    render(<Controlled initialView="week" defaultDate={d(2026, 12, 30)} />);
    expect(heading()).toHaveTextContent('27 December – 2 January 2027');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(heading()).toHaveTextContent('3 – 9 January 2027');
  });

  it('places timed events in the right day column at the right height', () => {
    renderCal({ view: 'week', events: [standup, review] });
    const btn = screen.getByRole('button', { name: 'Standup 09:00 – 09:30' });
    // Thursday is column 4 of a Sunday-start week; 48px per hour.
    expect(btn.closest('[data-cal-day-index]')).toHaveAttribute('data-cal-day-index', '4');
    expect(btn.style.top).toBe('432px');
    expect(btn.style.height).toBe('24px');
    const rev = screen.getByRole('button', { name: 'Design review 14:00 – 15:00' });
    expect(rev.closest('[data-cal-day-index]')).toHaveAttribute('data-cal-day-index', '2');
  });

  it('shows all-day events in their own row in the week and day views', () => {
    const holiday: CalendarEvent = { id: 'h', title: 'Holiday', start: d(2026, 9, 24), end: d(2026, 9, 25), allDay: true };
    const { unmount } = renderCal({ view: 'week', events: [holiday] });
    expect(screen.getByText('All-day')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Holiday (all-day)' })).toHaveLength(1);
    unmount();
    renderCal({ view: 'day', events: [holiday] });
    expect(screen.getByRole('region', { name: 'Thursday 24 September 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Holiday (all-day)' })).toBeInTheDocument();
  });

  it('lists and searches events in the agenda view', () => {
    renderCal({ view: 'agenda', events: [standup, review] });
    const agenda = screen.getByRole('region', { name: 'Agenda' });
    expect(within(agenda).getByText('Standup')).toBeInTheDocument();
    expect(within(agenda).getByText('Design review')).toBeInTheDocument();
    // Chronological: the 22nd comes before the 24th.
    const titles = within(agenda).getAllByRole('button').map((b) => b.textContent);
    expect(titles.findIndex((t) => t?.includes('Design review'))).toBeLessThan(
      titles.findIndex((t) => t?.includes('Standup')),
    );

    const search = screen.getByRole('searchbox', { name: 'Search events…' });
    fireEvent.change(search, { target: { value: 'MOCKUPS' } });
    expect(within(agenda).queryByText('Standup')).not.toBeInTheDocument();
    expect(within(agenda).getByText('Design review')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'nothing matches' } });
    expect(within(agenda).getByText('No events')).toBeInTheDocument();

    fireEvent.click(within(agenda).getByRole('button', { name: 'Close' }));
    expect(search).toHaveValue('');
    expect(within(agenda).getByText('Standup')).toBeInTheDocument();
  });

  it('does not treat typing in the agenda search as navigation shortcuts', () => {
    const onDateChange = vi.fn();
    renderCal({ view: 'agenda', onDateChange });
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 't' });
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'ArrowLeft' });
    expect(onDateChange).not.toHaveBeenCalled();
  });

  it('explains an empty resource view', () => {
    renderCal({ view: 'resource' });
    expect(screen.getByText('No resources defined')).toBeInTheDocument();
  });

  it('lays events out per resource and flags double bookings', () => {
    const resources = [{ id: 'a', name: 'Room A' }, { id: 'b', name: 'Room B' }];
    const events: CalendarEvent[] = [
      { id: 'r1', title: 'A1', start: d(2026, 9, 24, 9), end: d(2026, 9, 24, 10), resourceId: 'a' },
      { id: 'r2', title: 'A2', start: d(2026, 9, 24, 9, 30), end: d(2026, 9, 24, 11), resourceId: 'a' },
      { id: 'r3', title: 'B1', start: d(2026, 9, 24, 9), end: d(2026, 9, 24, 10), resourceId: 'b' },
      { id: 'r4', title: 'Loose', start: d(2026, 9, 24, 13), end: d(2026, 9, 24, 14) },
      { id: 'r5', title: 'Tomorrow', start: d(2026, 9, 25, 9), end: d(2026, 9, 25, 10), resourceId: 'a' },
    ];
    renderCal({ view: 'resource', resources, events });
    expect(screen.getByText('Room A')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A1 09:00 – 10:00' })).toHaveClass('ring-error');
    expect(screen.getByRole('button', { name: 'A2 09:30 – 11:00' })).toHaveClass('ring-error');
    // Same time, different resource: not a conflict.
    expect(screen.getByRole('button', { name: 'B1 09:00 – 10:00' })).not.toHaveClass('ring-error');
    expect(screen.getByRole('button', { name: 'Loose 13:00 – 14:00' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tomorrow/ })).not.toBeInTheDocument();
  });
});

describe('<Calendar /> event popover', () => {
  it('opens on click with the event details and closes on Escape', () => {
    const onEventClick = vi.fn();
    renderCal({ events: [review], calendars: [{ id: 'work', name: 'Work', color: 'info' }], onEventClick });
    fireEvent.click(screen.getByRole('button', { name: 'Design review — 14:00 to 15:00' }));
    expect(onEventClick).toHaveBeenCalledWith(review);

    const dialog = screen.getByRole('dialog', { name: 'Design review' });
    expect(dialog).toHaveTextContent('14:00 – 15:00');
    expect(dialog).toHaveTextContent('Bring mockups');
    expect(dialog).toHaveTextContent('Work');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on an outside pointer press and via its close button', () => {
    renderCal({ events: [standup] });
    fireEvent.click(screen.getByRole('button', { name: /^Standup/ }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Standup/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks for confirmation before deleting', () => {
    const onEventDelete = vi.fn();
    const onTelemetry = vi.fn();
    renderCal({ events: [standup], onEventDelete, onTelemetry });
    fireEvent.click(screen.getByRole('button', { name: /^Standup/ }));
    const dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(onEventDelete).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm delete?' }));
    expect(onEventDelete).toHaveBeenCalledWith('e1');
    expect(onTelemetry).toHaveBeenCalledWith({ type: 'event-delete', eventId: 'e1' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hands the event to onEventUpdate from Edit', () => {
    const onEventUpdate = vi.fn();
    renderCal({ events: [standup], onEventUpdate });
    fireEvent.click(screen.getByRole('button', { name: /^Standup/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEventUpdate).toHaveBeenCalledWith(standup);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('<Calendar /> calendar legend', () => {
  const calendars = [
    { id: 'work', name: 'Work', color: 'info' as const },
    { id: 'home', name: 'Home', color: 'success' as const },
  ];
  const chores: CalendarEvent = { id: 'c', title: 'Chores', start: d(2026, 9, 24, 18), end: d(2026, 9, 24, 19), calendarId: 'home' };

  it('toggles a calendar’s events on and off', () => {
    const onCalendarToggle = vi.fn();
    renderCal({ events: [review, chores, standup], calendars, onCalendarToggle });
    const legend = screen.getByRole('group', { name: 'Calendars' });
    const home = within(legend).getByRole('switch', { name: 'Home' });
    expect(home).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(home);
    expect(home).toHaveAttribute('aria-checked', 'false');
    expect(onCalendarToggle).toHaveBeenLastCalledWith('home', false);
    expect(screen.queryByRole('button', { name: /^Chores/ })).not.toBeInTheDocument();
    // Other calendars and uncategorised events stay visible.
    expect(screen.getByRole('button', { name: /^Design review/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Standup/ })).toBeInTheDocument();

    fireEvent.click(home);
    expect(onCalendarToggle).toHaveBeenLastCalledWith('home', true);
    expect(screen.getByRole('button', { name: /^Chores/ })).toBeInTheDocument();
  });

  it('can be hidden', () => {
    renderCal({ calendars, hideCalendarLegend: true });
    expect(screen.queryByRole('group', { name: 'Calendars' })).not.toBeInTheDocument();
  });
});

describe('useCalendarEngine', () => {
  it('throws a helpful error outside <Calendar />', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCalendarEngine())).toThrow(/inside <Calendar \/>/);
    vi.restoreAllMocks();
  });
});
