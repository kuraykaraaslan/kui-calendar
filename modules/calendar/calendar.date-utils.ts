export const MS_DAY = 24 * 60 * 60 * 1000;

export const HOUR_HEIGHT = 48;
export const MIN_EVENT_HEIGHT = 18;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function startOfWeek(d: Date, weekStart: 0 | 1): Date {
  const x = startOfDay(d);
  const diff = (x.getDay() - weekStart + 7) % 7;
  return addDays(x, -diff);
}

export function endOfWeek(d: Date, weekStart: 0 | 1): Date {
  return endOfDay(addDays(startOfWeek(d, weekStart), 6));
}

export function rangeDays(from: Date, count: number): Date[] {
  const arr: Date[] = [];
  for (let i = 0; i < count; i++) arr.push(addDays(from, i));
  return arr;
}

export function monthGrid(d: Date, weekStart: 0 | 1): Date[] {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const gridStart = startOfWeek(first, weekStart);
  return rangeDays(gridStart, 42);
}

export function eventOnDay<E extends { start: Date; end: Date }>(e: E, day: Date): boolean {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + MS_DAY;
  return e.start.getTime() < dayEnd && e.end.getTime() > dayStart;
}

export function fmtTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const _intlCache = new Map<string, Intl.DateTimeFormat>();
export function fmtTimeIntl(d: Date, locale?: string): string {
  if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return fmtTime(d);
  const key = locale ?? 'default';
  let fmt = _intlCache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
      _intlCache.set(key, fmt);
    } catch {
      return fmtTime(d);
    }
  }
  return fmt.format(d);
}

export function fmtTimeRange(start: Date, end: Date): string {
  return `${fmtTime(start)} – ${fmtTime(end)}`;
}

export function minutesIntoDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function periodLabel(
  view: 'month' | 'week' | 'day' | 'agenda' | 'resource',
  date: Date,
  monthNames: string[],
  weekStart: 0 | 1,
): string {
  const monthName = monthNames[date.getMonth()];
  if (view === 'month' || view === 'agenda' || view === 'resource') {
    return `${monthName} ${date.getFullYear()}`;
  }
  if (view === 'week') {
    const s = startOfWeek(date, weekStart);
    const e = endOfWeek(date, weekStart);
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()} – ${e.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${monthNames[s.getMonth()]} – ${e.getDate()} ${monthNames[e.getMonth()]} ${e.getFullYear()}`;
  }
  return `${date.getDate()} ${monthName} ${date.getFullYear()}`;
}

export function visibleWindow(
  view: 'month' | 'week' | 'day' | 'agenda' | 'resource',
  date: Date,
  weekStart: 0 | 1,
): [Date, Date] {
  if (view === 'month' || view === 'agenda' || view === 'resource') {
    const cells = monthGrid(date, weekStart);
    return [startOfDay(cells[0]!), endOfDay(cells[cells.length - 1]!)];
  }
  if (view === 'week') {
    const s = startOfWeek(date, weekStart);
    return [startOfDay(s), endOfDay(rangeDays(s, 7)[6]!)];
  }
  return [startOfDay(date), endOfDay(date)];
}

export function snapMinutes(d: Date, step: number): Date {
  const x = new Date(d);
  const m = x.getHours() * 60 + x.getMinutes();
  const snapped = Math.floor(m / step) * step;
  x.setHours(Math.floor(snapped / 60), snapped % 60, 0, 0);
  return x;
}

export function dateAtMinute(day: Date, minute: number): Date {
  const x = startOfDay(day);
  x.setMinutes(Math.max(0, Math.min(24 * 60 - 1, Math.round(minute))));
  return x;
}
