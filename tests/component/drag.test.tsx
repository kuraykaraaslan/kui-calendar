import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Calendar } from '../../react';
import { HOUR_HEIGHT } from '../../modules';
import type { CalendarEvent, CalendarProps } from '../../modules';

/*
 * jsdom does no layout, so every rect is zero-sized. Give each element the
 * geometry of a full-height day column (top at 0, 48px per hour) — that is
 * all the drag hooks measure — and let each test say which column is under
 * the pointer via `elementFromPoint`.
 */
const COLUMN_HEIGHT = 24 * HOUR_HEIGHT;
const y = (hours: number) => hours * HOUR_HEIGHT;
const d = (y_: number, m: number, day: number, h = 0, min = 0) => new Date(y_, m - 1, day, h, min);

const standup: CalendarEvent = { id: 'e1', title: 'Standup', start: d(2026, 9, 24, 9), end: d(2026, 9, 24, 9, 30) };

const originalElementFromPoint = document.elementFromPoint;
beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, left: 0, right: 100, bottom: COLUMN_HEIGHT, width: 100, height: COLUMN_HEIGHT, x: 0, y: 0,
    toJSON: () => ({}),
  } as DOMRect);
});
afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: originalElementFromPoint });
});

function renderWeek(props: Partial<CalendarProps> = {}) {
  const utils = render(
    <Calendar view="week" locale="en" defaultDate={d(2026, 9, 24)} events={[standup]} slotMinutes={30} {...props} />,
  );
  const column = (i: number) => utils.container.querySelector<HTMLElement>(`[data-cal-day-index="${i}"]`)!;
  /** The pointer-sensitive surface below a column's header. */
  const surface = (i: number) => column(i).children[1] as HTMLElement;
  return { ...utils, column, surface };
}

describe('drag to create', () => {
  it('creates an event spanning the dragged slots', () => {
    const onEventCreate = vi.fn();
    const onTelemetry = vi.fn();
    const { surface } = renderWeek({ onEventCreate, onTelemetry });

    fireEvent.pointerDown(surface(2), { button: 0, clientY: y(9) });
    expect(within(surface(2)).getByText('09:00 – 09:30')).toBeInTheDocument();
    fireEvent.pointerMove(window, { clientY: y(10.4) });
    expect(within(surface(2)).getByText('09:00 – 10:30')).toBeInTheDocument();
    fireEvent.pointerUp(window);

    // Column 2 of a Sunday-start week is Tuesday 22 September.
    expect(onEventCreate).toHaveBeenCalledWith({ start: d(2026, 9, 22, 9), end: d(2026, 9, 22, 10, 30) });
    expect(onTelemetry).toHaveBeenCalledWith({ type: 'event-create', start: d(2026, 9, 22, 9), end: d(2026, 9, 22, 10, 30) });
    expect(within(surface(2)).queryByText('09:00 – 10:30')).not.toBeInTheDocument();
  });

  it('snaps a plain click to a single slot of the configured size', () => {
    const onEventCreate = vi.fn();
    const { surface } = renderWeek({ onEventCreate, slotMinutes: 15 });
    fireEvent.pointerDown(surface(0), { button: 0, clientY: y(13.3) });
    fireEvent.pointerUp(window);
    expect(onEventCreate).toHaveBeenCalledWith({ start: d(2026, 9, 20, 13, 15), end: d(2026, 9, 20, 13, 30) });
  });

  it('never drags the end above the start', () => {
    const onEventCreate = vi.fn();
    const { surface } = renderWeek({ onEventCreate });
    fireEvent.pointerDown(surface(3), { button: 0, clientY: y(15) });
    fireEvent.pointerMove(window, { clientY: y(8) });
    fireEvent.pointerUp(window);
    expect(onEventCreate).toHaveBeenCalledWith({ start: d(2026, 9, 23, 15), end: d(2026, 9, 23, 15, 30) });
  });

  it('is cancelled by Escape', () => {
    const onEventCreate = vi.fn();
    const { surface } = renderWeek({ onEventCreate });
    fireEvent.pointerDown(surface(2), { button: 0, clientY: y(9) });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(within(surface(2)).queryByText('09:00 – 09:30')).not.toBeInTheDocument();
    fireEvent.pointerUp(window);
    expect(onEventCreate).not.toHaveBeenCalled();
  });

  it('ignores non-primary buttons and presses on existing events', () => {
    const onEventCreate = vi.fn();
    const { surface } = renderWeek({ onEventCreate });
    fireEvent.pointerDown(surface(2), { button: 2, clientY: y(9) });
    fireEvent.pointerUp(window);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Standup 09:00 – 09:30' }), { button: 0, clientY: y(9) });
    fireEvent.pointerUp(window);
    expect(onEventCreate).not.toHaveBeenCalled();
  });
});

describe('drag to move', () => {
  it('moves an event to another day and time, keeping its duration', () => {
    const onEventUpdate = vi.fn();
    const onTelemetry = vi.fn();
    const { column } = renderWeek({ onEventUpdate, onTelemetry });
    const friday = column(5);
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => friday });

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Standup 09:00 – 09:30' }), { button: 0, clientY: y(9) });
    fireEvent.pointerMove(window, { clientX: 50, clientY: y(12.6) });
    fireEvent.pointerUp(window);

    expect(onEventUpdate).toHaveBeenCalledWith({ ...standup, start: d(2026, 9, 25, 12, 30), end: d(2026, 9, 25, 13) });
    expect(onTelemetry).toHaveBeenCalledWith({ type: 'event-update', eventId: 'e1' });
  });

  it('does nothing when the pointer never moves', () => {
    const onEventUpdate = vi.fn();
    renderWeek({ onEventUpdate });
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Standup 09:00 – 09:30' }), { button: 0, clientY: y(9) });
    fireEvent.pointerUp(window);
    expect(onEventUpdate).not.toHaveBeenCalled();
  });
});

describe('drag to resize', () => {
  it('extends the end to the snapped slot under the pointer', () => {
    const onEventUpdate = vi.fn();
    renderWeek({ onEventUpdate });
    const handle = screen.getByRole('separator', { name: 'Resize' });

    fireEvent.pointerDown(handle, { button: 0, clientY: y(9.5) });
    fireEvent.pointerMove(window, { clientY: y(12.1) });
    fireEvent.pointerUp(window);

    expect(onEventUpdate).toHaveBeenCalledTimes(1);
    expect(onEventUpdate).toHaveBeenCalledWith({ ...standup, end: d(2026, 9, 24, 12, 30) });
  });

  it('keeps at least one slot', () => {
    const onEventUpdate = vi.fn();
    renderWeek({ onEventUpdate, events: [{ ...standup, end: d(2026, 9, 24, 11) }] });
    fireEvent.pointerDown(screen.getByRole('separator', { name: 'Resize' }), { button: 0, clientY: y(11) });
    fireEvent.pointerMove(window, { clientY: y(3) });
    fireEvent.pointerUp(window);
    expect(onEventUpdate).toHaveBeenCalledWith({ ...standup, end: d(2026, 9, 24, 9, 30) });
  });
});
