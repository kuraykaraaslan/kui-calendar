import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  dateAtMinute,
  endOfDay,
  endOfWeek,
  eventOnDay,
  fmtTime,
  fmtTimeIntl,
  fmtTimeRange,
  isSameDay,
  isSameMonth,
  minutesIntoDay,
  monthGrid,
  periodLabel,
  rangeDays,
  snapMinutes,
  startOfDay,
  startOfWeek,
  visibleWindow,
} from '../../modules/calendar/calendar.date-utils';
import { resolveLocale } from '../../modules/calendar/locale';

const HOUR = 60 * 60 * 1000;
const EN = resolveLocale('en').monthNames;

/** Local-time y/m/d(/h/min), month 1-based for readability. */
const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
/** yyyy-mm-dd hh:mm in local time — keeps failures readable. */
const fmt = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')} ${fmtTime(x)}`;

describe('test environment', () => {
  it('runs in a DST-observing timezone so 23h/25h days are exercised', () => {
    // 8 March 2026 (spring forward) is 23 hours long, 1 November 2026 is 25.
    expect(d(2026, 3, 9).getTime() - d(2026, 3, 8).getTime()).toBe(23 * HOUR);
    expect(d(2026, 11, 2).getTime() - d(2026, 11, 1).getTime()).toBe(25 * HOUR);
  });
});

describe('startOfDay / endOfDay', () => {
  it('clamps to the first and last millisecond of the local day without mutating', () => {
    const src = d(2026, 9, 24, 15, 42);
    const before = src.getTime();
    expect(startOfDay(src)).toEqual(d(2026, 9, 24));
    const end = endOfDay(src);
    expect([end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds()]).toEqual([23, 59, 59, 999]);
    expect(end.getDate()).toBe(24);
    expect(src.getTime()).toBe(before);
  });
});

describe('isSameDay / isSameMonth', () => {
  it('compares calendar fields, not timestamps', () => {
    expect(isSameDay(d(2026, 9, 24, 0, 0), d(2026, 9, 24, 23, 59))).toBe(true);
    expect(isSameDay(d(2026, 9, 24, 23, 59), d(2026, 9, 25, 0, 0))).toBe(false);
    expect(isSameMonth(d(2026, 9, 1), d(2026, 9, 30))).toBe(true);
  });

  it('distinguishes the same day/month in different years', () => {
    expect(isSameDay(d(2025, 12, 31), d(2026, 12, 31))).toBe(false);
    expect(isSameMonth(d(2025, 12, 1), d(2026, 12, 1))).toBe(false);
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(fmt(addDays(d(2026, 12, 31, 10), 1))).toBe('2027-01-01 10:00');
    expect(fmt(addDays(d(2027, 1, 1), -1))).toBe('2026-12-31 00:00');
    expect(fmt(addDays(d(2026, 1, 31), 1))).toBe('2026-02-01 00:00');
  });

  it('handles leap and non-leap Februaries', () => {
    expect(fmt(addDays(d(2028, 3, 1), -1))).toBe('2028-02-29 00:00');
    expect(fmt(addDays(d(2026, 3, 1), -1))).toBe('2026-02-28 00:00');
    expect(fmt(addDays(d(2028, 2, 28), 1))).toBe('2028-02-29 00:00');
  });

  it('keeps the wall-clock time across DST transitions (calendar days, not 24h)', () => {
    const spring = addDays(d(2026, 3, 7, 9, 30), 1);
    expect(fmt(spring)).toBe('2026-03-08 09:30');
    expect(spring.getTime() - d(2026, 3, 7, 9, 30).getTime()).toBe(23 * HOUR);

    const fall = addDays(d(2026, 10, 31, 9, 30), 1);
    expect(fmt(fall)).toBe('2026-11-01 09:30');
    expect(fall.getTime() - d(2026, 10, 31, 9, 30).getTime()).toBe(25 * HOUR);
  });

  it('does not mutate its input', () => {
    const src = d(2026, 9, 24);
    addDays(src, 5);
    expect(fmt(src)).toBe('2026-09-24 00:00');
  });
});

describe('addMonths', () => {
  it('moves by whole months and preserves the time of day', () => {
    expect(fmt(addMonths(d(2026, 9, 24, 14, 5), 1))).toBe('2026-10-24 14:05');
    expect(fmt(addMonths(d(2026, 9, 24), -3))).toBe('2026-06-24 00:00');
  });

  it('crosses year boundaries in both directions', () => {
    expect(fmt(addMonths(d(2026, 12, 15), 1))).toBe('2027-01-15 00:00');
    expect(fmt(addMonths(d(2026, 1, 15), -1))).toBe('2025-12-15 00:00');
    expect(fmt(addMonths(d(2026, 6, 1), 24))).toBe('2028-06-01 00:00');
  });

  it('clamps to the last day of a shorter target month instead of overflowing', () => {
    // Regression: `setMonth` overflow turned 31 Jan + 1 month into 3 March,
    // so "next month" from the 31st skipped February entirely.
    expect(fmt(addMonths(d(2026, 1, 31), 1))).toBe('2026-02-28 00:00');
    expect(fmt(addMonths(d(2028, 1, 31), 1))).toBe('2028-02-29 00:00');
    expect(fmt(addMonths(d(2026, 3, 31), -1))).toBe('2026-02-28 00:00');
    expect(fmt(addMonths(d(2026, 10, 31), 1))).toBe('2026-11-30 00:00');
    expect(fmt(addMonths(d(2028, 2, 29), 12))).toBe('2029-02-28 00:00');
  });

  it('does not mutate its input', () => {
    const src = d(2026, 1, 31);
    addMonths(src, 1);
    expect(fmt(src)).toBe('2026-01-31 00:00');
  });
});

describe('startOfWeek / endOfWeek', () => {
  // Thursday 24 September 2026
  const thu = d(2026, 9, 24, 13, 0);

  it('respects a Sunday or Monday week start', () => {
    expect(fmt(startOfWeek(thu, 0))).toBe('2026-09-20 00:00');
    expect(fmt(startOfWeek(thu, 1))).toBe('2026-09-21 00:00');
  });

  it('treats Sunday as the last day of a Monday-start week', () => {
    expect(fmt(startOfWeek(d(2026, 9, 27), 1))).toBe('2026-09-21 00:00');
    expect(fmt(startOfWeek(d(2026, 9, 27), 0))).toBe('2026-09-27 00:00');
  });

  it('returns the day itself when it already is the week start', () => {
    expect(fmt(startOfWeek(d(2026, 9, 21, 8), 1))).toBe('2026-09-21 00:00');
  });

  it('crosses the year boundary', () => {
    // 1 January 2026 is a Thursday.
    expect(fmt(startOfWeek(d(2026, 1, 1), 1))).toBe('2025-12-29 00:00');
    expect(fmt(endOfWeek(d(2025, 12, 30), 1))).toBe('2026-01-04 23:59');
  });

  it('ends on the last millisecond of the seventh day', () => {
    const end = endOfWeek(thu, 0);
    expect(fmt(end)).toBe('2026-09-26 23:59');
    expect(end.getMilliseconds()).toBe(999);
  });
});

describe('rangeDays', () => {
  it('returns consecutive local midnights, even across DST', () => {
    const days = rangeDays(d(2026, 3, 6), 5);
    expect(days.map(fmt)).toEqual([
      '2026-03-06 00:00',
      '2026-03-07 00:00',
      '2026-03-08 00:00',
      '2026-03-09 00:00',
      '2026-03-10 00:00',
    ]);
  });

  it('returns an empty array for a zero count', () => {
    expect(rangeDays(d(2026, 1, 1), 0)).toEqual([]);
  });
});

describe('monthGrid', () => {
  it('always returns 6 full weeks (42 cells) of consecutive days', () => {
    for (let m = 1; m <= 12; m++) {
      for (const ws of [0, 1] as const) {
        const cells = monthGrid(d(2026, m, 15), ws);
        expect(cells).toHaveLength(42);
        expect(cells[0]!.getDay()).toBe(ws);
        for (let i = 1; i < cells.length; i++) {
          expect(isSameDay(cells[i]!, addDays(cells[i - 1]!, 1))).toBe(true);
          expect(cells[i]!.getHours()).toBe(0);
        }
      }
    }
  });

  it('contains every day of the target month', () => {
    const cells = monthGrid(d(2028, 2, 10), 1);
    const inMonth = cells.filter((c) => c.getMonth() === 1 && c.getFullYear() === 2028);
    expect(inMonth).toHaveLength(29);
  });

  it('starts on the 1st when the month begins on the week-start day', () => {
    // February 2026 begins on a Sunday.
    expect(fmt(monthGrid(d(2026, 2, 20), 0)[0]!)).toBe('2026-02-01 00:00');
    expect(fmt(monthGrid(d(2026, 2, 20), 1)[0]!)).toBe('2026-01-26 00:00');
  });

  it('leads in from the previous year for January', () => {
    const cells = monthGrid(d(2027, 1, 10), 1);
    // 1 January 2027 is a Friday → grid opens on Monday 28 December 2026.
    expect(fmt(cells[0]!)).toBe('2026-12-28 00:00');
    expect(fmt(cells[41]!)).toBe('2027-02-07 00:00');
  });
});

describe('eventOnDay', () => {
  const ev = (start: Date, end: Date) => ({ start, end });

  it('includes events that touch any part of the day', () => {
    expect(eventOnDay(ev(d(2026, 9, 24, 9), d(2026, 9, 24, 10)), d(2026, 9, 24))).toBe(true);
    expect(eventOnDay(ev(d(2026, 9, 24, 0), d(2026, 9, 24, 0, 30)), d(2026, 9, 24, 18))).toBe(true);
  });

  it('treats the end as exclusive: an event ending at midnight is not on the next day', () => {
    expect(eventOnDay(ev(d(2026, 9, 24, 22), d(2026, 9, 25, 0)), d(2026, 9, 25))).toBe(false);
    expect(eventOnDay(ev(d(2026, 9, 24, 22), d(2026, 9, 25, 0)), d(2026, 9, 24))).toBe(true);
  });

  it('includes every day a multi-day event spans', () => {
    const e = ev(d(2026, 12, 30, 12), d(2027, 1, 2, 12));
    expect(eventOnDay(e, d(2026, 12, 29))).toBe(false);
    expect(eventOnDay(e, d(2026, 12, 30))).toBe(true);
    expect(eventOnDay(e, d(2026, 12, 31))).toBe(true);
    expect(eventOnDay(e, d(2027, 1, 1))).toBe(true);
    expect(eventOnDay(e, d(2027, 1, 2))).toBe(true);
    expect(eventOnDay(e, d(2027, 1, 3))).toBe(false);
  });

  it('uses the real length of a 23-hour day (spring forward)', () => {
    // Regression: day end was computed as start + 24h, which on 8 March
    // reaches 01:00 on the 9th — so an early event on the 9th leaked onto the 8th.
    const early = ev(d(2026, 3, 9, 0, 30), d(2026, 3, 9, 0, 45));
    expect(eventOnDay(early, d(2026, 3, 8))).toBe(false);
    expect(eventOnDay(early, d(2026, 3, 9))).toBe(true);
  });

  it('uses the real length of a 25-hour day (fall back)', () => {
    // …and on 1 November start + 24h is 23:00, dropping the day's last hour.
    const late = ev(d(2026, 11, 1, 23, 30), d(2026, 11, 1, 23, 45));
    expect(eventOnDay(late, d(2026, 11, 1))).toBe(true);
    expect(eventOnDay(late, d(2026, 11, 2))).toBe(false);
  });
});

describe('time formatting', () => {
  it('formats 24h zero-padded times', () => {
    expect(fmtTime(d(2026, 1, 1, 9, 5))).toBe('09:05');
    expect(fmtTime(d(2026, 1, 1, 0, 0))).toBe('00:00');
    expect(fmtTime(d(2026, 1, 1, 23, 59))).toBe('23:59');
  });

  it('formats a range with an en dash', () => {
    expect(fmtTimeRange(d(2026, 1, 1, 9), d(2026, 1, 1, 10, 30))).toBe('09:00 – 10:30');
  });

  it('formats via Intl for a valid locale and falls back for an invalid one', () => {
    expect(fmtTimeIntl(d(2026, 1, 1, 9, 5), 'en-GB')).toBe('09:05');
    expect(fmtTimeIntl(d(2026, 1, 1, 14, 30), '!!not-a-locale!!')).toBe('14:30');
  });

  it('counts minutes since local midnight', () => {
    expect(minutesIntoDay(d(2026, 1, 1, 0, 0))).toBe(0);
    expect(minutesIntoDay(d(2026, 1, 1, 13, 45))).toBe(825);
    expect(minutesIntoDay(d(2026, 11, 1, 23, 30))).toBe(23 * 60 + 30);
  });
});

describe('periodLabel', () => {
  it('labels month-scoped views with month and year', () => {
    for (const view of ['month', 'agenda', 'resource'] as const) {
      expect(periodLabel(view, d(2026, 9, 24), EN, 0)).toBe('September 2026');
    }
  });

  it('labels a week within one month compactly', () => {
    expect(periodLabel('week', d(2026, 9, 24), EN, 0)).toBe('20 – 26 September 2026');
    expect(periodLabel('week', d(2026, 9, 24), EN, 1)).toBe('21 – 27 September 2026');
  });

  it('names both months for a week that straddles a month boundary', () => {
    expect(periodLabel('week', d(2026, 10, 1), EN, 0)).toBe('27 September – 3 October 2026');
  });

  it('labels a single day', () => {
    expect(periodLabel('day', d(2026, 2, 28), EN, 1)).toBe('28 February 2026');
  });
});

describe('visibleWindow', () => {
  it('spans the whole 42-cell grid for month-scoped views', () => {
    const [s, e] = visibleWindow('month', d(2026, 9, 24), 0);
    expect(fmt(s)).toBe('2026-08-30 00:00');
    expect(fmt(e)).toBe('2026-10-10 23:59');
    expect(visibleWindow('agenda', d(2026, 9, 24), 0)).toEqual([s, e]);
  });

  it('spans exactly one week for the week view', () => {
    const [s, e] = visibleWindow('week', d(2026, 9, 24, 12), 1);
    expect(fmt(s)).toBe('2026-09-21 00:00');
    expect(fmt(e)).toBe('2026-09-27 23:59');
  });

  it('spans one day for the day view, including a 25-hour one', () => {
    const [s, e] = visibleWindow('day', d(2026, 11, 1, 12), 1);
    expect(fmt(s)).toBe('2026-11-01 00:00');
    expect(fmt(e)).toBe('2026-11-01 23:59');
    expect(e.getTime() - s.getTime()).toBe(25 * HOUR - 1);
  });
});

describe('snapMinutes / dateAtMinute', () => {
  it('snaps down to the step and zeroes seconds', () => {
    const x = new Date(2026, 0, 1, 10, 47, 33, 500);
    expect(fmt(snapMinutes(x, 15))).toBe('2026-01-01 10:45');
    expect(snapMinutes(x, 15).getSeconds()).toBe(0);
    expect(fmt(snapMinutes(x, 60))).toBe('2026-01-01 10:00');
    expect(fmt(snapMinutes(d(2026, 1, 1, 10, 45), 15))).toBe('2026-01-01 10:45');
  });

  it('places a minute offset on the given day, clamped to the day', () => {
    expect(fmt(dateAtMinute(d(2026, 9, 24, 17), 90))).toBe('2026-09-24 01:30');
    expect(fmt(dateAtMinute(d(2026, 9, 24), -30))).toBe('2026-09-24 00:00');
    expect(fmt(dateAtMinute(d(2026, 9, 24), 24 * 60 + 30))).toBe('2026-09-24 23:59');
    expect(fmt(dateAtMinute(d(2026, 9, 24), 89.6))).toBe('2026-09-24 01:30');
  });

  it('maps minutes to wall-clock time on DST days', () => {
    expect(fmt(dateAtMinute(d(2026, 3, 8), 600))).toBe('2026-03-08 10:00');
    expect(fmt(dateAtMinute(d(2026, 11, 1), 600))).toBe('2026-11-01 10:00');
  });
});
