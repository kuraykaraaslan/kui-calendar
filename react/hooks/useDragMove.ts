import { useCallback } from 'react';
import type { CalendarTelemetry, CalendarEvent } from '../../modules/calendar/calendar.types.js';
import { dateAtMinute, minutesIntoDay } from '../../modules/calendar/calendar.date-utils.js';
import { hitTestDayColumn, snapMinutesInt, yToMinutes } from '../../modules/calendar/calendar.drag-math.js';
import { useCalStore, useCalStoreApi } from './useCalStore.js';

type Options = {
  days: Date[];
  slotMinutes: number;
  onEventUpdate?: (e: CalendarEvent) => void | Promise<void>;
  onTelemetry?: (e: CalendarTelemetry) => void;
};

export function useDragMove({ days, slotMinutes, onEventUpdate, onTelemetry }: Options) {
  const setDrag = useCalStore((s) => s.setDrag);
  const storeApi = useCalStoreApi();

  return useCallback(
    (event: CalendarEvent, sourceDayIndex: number) =>
      (e: React.PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        const duration = event.end.getTime() - event.start.getTime();
        const pointerOffsetMin =
          minutesIntoDay(event.start) -
          yToMinutes(
            e.clientY -
              (e.currentTarget.closest<HTMLElement>('[data-cal-day-index]')?.getBoundingClientRect().top ?? 0),
            Number.POSITIVE_INFINITY,
          );

        function update(clientX: number, clientY: number) {
          const hit = hitTestDayColumn(clientX, clientY);
          const col = hit?.col ?? null;
          const dayIndex = hit?.index ?? sourceDayIndex;
          if (!col) return;
          const rect = col.getBoundingClientRect();
          const rawMin = yToMinutes(clientY - rect.top, rect.height) + pointerOffsetMin;
          const startMin = Math.max(0, Math.min(24 * 60 - 1, snapMinutesInt(rawMin, slotMinutes)));
          const day = days[dayIndex] ?? days[sourceDayIndex]!;
          const newStart = dateAtMinute(day, startMin);
          const newEnd = new Date(newStart.getTime() + duration);
          setDrag({ kind: 'move', eventId: event.id, ghostStart: newStart, ghostEnd: newEnd, dayIndex });
        }

        function onMove(ev: PointerEvent) { update(ev.clientX, ev.clientY); }

        function onUp(ev: PointerEvent) {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('keydown', onKey, true);

          const drag = storeApi.getState().drag;
          setDrag({ kind: 'idle' });
          if (drag.kind !== 'move' || drag.eventId !== event.id) return;
          const moved =
            Math.abs(drag.ghostStart.getTime() - event.start.getTime()) >= 60_000 ||
            drag.dayIndex !== sourceDayIndex;
          if (!moved) return;
          ev.preventDefault();
          onEventUpdate?.({ ...event, start: drag.ghostStart, end: drag.ghostEnd });
          onTelemetry?.({ type: 'event-update', eventId: event.id });
        }

        function onKey(ev: KeyboardEvent) {
          if (ev.key !== 'Escape') return;
          ev.preventDefault();
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('keydown', onKey, true);
          setDrag({ kind: 'idle' });
        }

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('keydown', onKey, true);
      },
    [days, slotMinutes, onEventUpdate, onTelemetry, setDrag, storeApi],
  );
}
