import { useCallback } from 'react';
import type { CalendarTelemetry } from '../../modules/calendar/calendar.types';
import { dateAtMinute } from '../../modules/calendar/calendar.date-utils';
import { snapMinutesInt, yToMinutes } from '../../modules/calendar/calendar.drag-math';
import { useCalStore, useCalStoreApi } from './useCalStore';

type Options = {
  days: Date[];
  slotMinutes: number;
  onEventCreate?: (range: { start: Date; end: Date }) => void | Promise<void>;
  onTelemetry?: (e: CalendarTelemetry) => void;
};

export function useDragCreate({ days, slotMinutes, onEventCreate, onTelemetry }: Options) {
  const setDrag = useCalStore((s) => s.setDrag);
  const storeApi = useCalStoreApi();

  return useCallback(
    (dayIndex: number) => (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-event-id]') || target?.closest('[data-resize-handle]')) return;
      e.preventDefault();

      const col = e.currentTarget;
      const rect = col.getBoundingClientRect();
      const startRawMin = yToMinutes(e.clientY - rect.top, rect.height);
      const startMin = snapMinutesInt(startRawMin, slotMinutes);
      const day = days[dayIndex]!;
      const start0 = dateAtMinute(day, startMin);
      const end0 = dateAtMinute(day, startMin + slotMinutes);
      setDrag({ kind: 'create', ghostStart: start0, ghostEnd: end0, dayIndex });

      function update(clientY: number) {
        const r = col.getBoundingClientRect();
        const rawMin = yToMinutes(clientY - r.top, r.height);
        const snapped = snapMinutesInt(rawMin, slotMinutes) + slotMinutes;
        const endMin = Math.max(startMin + slotMinutes, Math.min(24 * 60, snapped));
        setDrag({ kind: 'create', ghostStart: start0, ghostEnd: dateAtMinute(day, endMin), dayIndex });
      }

      function onMove(ev: PointerEvent) { update(ev.clientY); }

      function onUp(ev: PointerEvent) {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('keydown', onKey, true);

        const drag = storeApi.getState().drag;
        setDrag({ kind: 'idle' });
        if (drag.kind !== 'create') return;
        if (drag.ghostEnd.getTime() - drag.ghostStart.getTime() < slotMinutes * 60_000) return;
        ev.preventDefault();
        onEventCreate?.({ start: drag.ghostStart, end: drag.ghostEnd });
        onTelemetry?.({ type: 'event-create', start: drag.ghostStart, end: drag.ghostEnd });
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
    [days, slotMinutes, onEventCreate, onTelemetry, setDrag, storeApi],
  );
}
