import { HOUR_HEIGHT } from './calendar.date-utils.js';

export function yToMinutes(y: number, columnHeight: number): number {
  const clamped = Math.max(0, Math.min(columnHeight, y));
  return Math.round((clamped / HOUR_HEIGHT) * 60);
}

export function snapMinutesInt(minute: number, step: number): number {
  return Math.floor(minute / step) * step;
}

export function hitTestDayColumn(
  clientX: number,
  clientY: number,
): { col: HTMLElement; index: number } | null {
  if (typeof document === 'undefined') return null;
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
  if (!el) return null;
  const col = el.closest<HTMLElement>('[data-cal-day-index]');
  if (!col) return null;
  const idx = Number(col.dataset['calDayIndex']);
  if (!Number.isFinite(idx)) return null;
  return { col, index: idx };
}
