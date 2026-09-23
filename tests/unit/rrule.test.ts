import { describe, expect, it } from 'vitest';
import { expandRRule, isException, parseRRule } from '../../modules/calendar/calendar.rrule';
import { fmtTime } from '../../modules/calendar/calendar.date-utils';

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const fmt = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')} ${fmtTime(x)}`;

/** Expand an RRULE string over [from, to] and render the results as local strings. */
function expand(rule: string, dtstart: Date, from: Date, to: Date, hardCap?: number): string[] {
  return expandRRule(parseRRule(rule), dtstart, from, to, hardCap).map(fmt);
}

describe('parseRRule', () => {
  it('parses the supported tokens', () => {
    const r = parseRRule('FREQ=WEEKLY;INTERVAL=2;COUNT=6;BYDAY=MO,WE,FR');
    expect(r).toEqual({ freq: 'WEEKLY', interval: 2, count: 6, until: undefined, byDay: [1, 3, 5] });
  });

  it('is tolerant of key case, whitespace, empty parts and bare tokens', () => {
    const r = parseRRule('  freq=DAILY ; interval=3 ;; JUNK ; byday=su, sa ');
    expect(r.freq).toBe('DAILY');
    expect(r.interval).toBe(3);
    expect(r.byDay).toEqual([0, 6]);
  });

  it('defaults INTERVAL to 1 and rejects nonsense intervals', () => {
    expect(parseRRule('FREQ=DAILY').interval).toBe(1);
    expect(parseRRule('FREQ=DAILY;INTERVAL=abc').interval).toBe(1);
    expect(parseRRule('FREQ=DAILY;INTERVAL=0').interval).toBe(1);
    expect(parseRRule('FREQ=DAILY;INTERVAL=-4').interval).toBe(1);
  });

  it('clamps COUNT to at least one occurrence', () => {
    expect(parseRRule('FREQ=DAILY;COUNT=0').count).toBe(1);
    expect(parseRRule('FREQ=DAILY').count).toBeUndefined();
  });

  it('drops unknown BYDAY codes', () => {
    expect(parseRRule('FREQ=WEEKLY;BYDAY=MO,XX,FR').byDay).toEqual([1, 5]);
  });

  it('reads a date-only UNTIL as the end of that local day (inclusive)', () => {
    const until = parseRRule('FREQ=DAILY;UNTIL=20261231').until!;
    expect(fmt(until)).toBe('2026-12-31 23:59');
    expect(until.getMilliseconds()).toBe(999);
  });

  it('reads UTC and floating date-time UNTIL values', () => {
    expect(parseRRule('FREQ=DAILY;UNTIL=20260905T130000Z').until!.toISOString()).toBe('2026-09-05T13:00:00.000Z');
    expect(fmt(parseRRule('FREQ=DAILY;UNTIL=20260905T093000').until!)).toBe('2026-09-05 09:30');
    expect(parseRRule('FREQ=DAILY;UNTIL=2026-09-05T10:00:00Z').until!.toISOString()).toBe('2026-09-05T10:00:00.000Z');
  });

  it('throws on a missing or unsupported FREQ', () => {
    expect(() => parseRRule('INTERVAL=2')).toThrow(/FREQ/);
    expect(() => parseRRule('FREQ=HOURLY')).toThrow(/FREQ/);
    expect(() => parseRRule('')).toThrow(/FREQ/);
  });
});

describe('expandRRule — DAILY', () => {
  const start = d(2026, 9, 1, 9, 0);

  it('emits COUNT occurrences at the start time', () => {
    expect(expand('FREQ=DAILY;COUNT=3', start, d(2026, 9, 1), d(2026, 9, 30))).toEqual([
      '2026-09-01 09:00',
      '2026-09-02 09:00',
      '2026-09-03 09:00',
    ]);
  });

  it('counts COUNT from DTSTART, not from the window start', () => {
    expect(expand('FREQ=DAILY;COUNT=10', start, d(2026, 9, 8), d(2026, 9, 30))).toEqual([
      '2026-09-08 09:00',
      '2026-09-09 09:00',
      '2026-09-10 09:00',
    ]);
  });

  it('honours INTERVAL', () => {
    expect(expand('FREQ=DAILY;INTERVAL=2;COUNT=3', start, d(2026, 9, 1), d(2026, 9, 30))).toEqual([
      '2026-09-01 09:00',
      '2026-09-03 09:00',
      '2026-09-05 09:00',
    ]);
  });

  it('treats a date-only UNTIL as inclusive', () => {
    expect(expand('FREQ=DAILY;UNTIL=20260903', start, d(2026, 8, 1), d(2026, 12, 31))).toHaveLength(3);
  });

  it('stops at the window end and never emits before DTSTART', () => {
    expect(expand('FREQ=DAILY', start, d(2026, 8, 25), d(2026, 9, 2, 23, 59))).toEqual([
      '2026-09-01 09:00',
      '2026-09-02 09:00',
    ]);
    expect(expand('FREQ=DAILY', start, d(2026, 8, 1), d(2026, 8, 31))).toEqual([]);
  });

  it('crosses month and year boundaries', () => {
    expect(expand('FREQ=DAILY;COUNT=3', d(2026, 12, 30, 8), d(2026, 12, 1), d(2027, 1, 31))).toEqual([
      '2026-12-30 08:00',
      '2026-12-31 08:00',
      '2027-01-01 08:00',
    ]);
  });

  it('keeps the wall-clock time across DST transitions', () => {
    const spring = expand('FREQ=DAILY;COUNT=4', d(2026, 3, 6, 9), d(2026, 3, 1), d(2026, 3, 31));
    expect(spring).toEqual(['2026-03-06 09:00', '2026-03-07 09:00', '2026-03-08 09:00', '2026-03-09 09:00']);
    const fall = expand('FREQ=DAILY;COUNT=3', d(2026, 10, 31, 9), d(2026, 10, 1), d(2026, 11, 30));
    expect(fall).toEqual(['2026-10-31 09:00', '2026-11-01 09:00', '2026-11-02 09:00']);
  });

  it('does not let a skipped (non-existent) local time shift later occurrences', () => {
    // 02:30 does not exist on 8 March 2026; that one instance is pushed to
    // 03:30, but the series must return to 02:30 afterwards.
    expect(expand('FREQ=DAILY;COUNT=3', d(2026, 3, 7, 2, 30), d(2026, 3, 1), d(2026, 3, 31))).toEqual([
      '2026-03-07 02:30',
      '2026-03-08 03:30',
      '2026-03-09 02:30',
    ]);
  });

  it('respects the hard cap on emitted occurrences', () => {
    expect(expand('FREQ=DAILY', start, d(2026, 9, 1), d(2030, 1, 1), 10)).toHaveLength(10);
  });
});

describe('expandRRule — WEEKLY', () => {
  it('repeats on the DTSTART weekday without BYDAY', () => {
    expect(expand('FREQ=WEEKLY;COUNT=3', d(2026, 9, 24, 10), d(2026, 9, 1), d(2026, 12, 31))).toEqual([
      '2026-09-24 10:00',
      '2026-10-01 10:00',
      '2026-10-08 10:00',
    ]);
  });

  it('expands BYDAY within each week in weekday order', () => {
    // Monday 21 September 2026
    expect(expand('FREQ=WEEKLY;BYDAY=FR,MO,WE;COUNT=5', d(2026, 9, 21, 10), d(2026, 9, 1), d(2026, 12, 31))).toEqual([
      '2026-09-21 10:00',
      '2026-09-23 10:00',
      '2026-09-25 10:00',
      '2026-09-28 10:00',
      '2026-09-30 10:00',
    ]);
  });

  it('skips BYDAY slots earlier than DTSTART in the first week (and does not count them)', () => {
    // Thursday 24 September: Monday and Wednesday of that week are before DTSTART.
    expect(expand('FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=3', d(2026, 9, 24, 10), d(2026, 9, 1), d(2026, 12, 31))).toEqual([
      '2026-09-25 10:00',
      '2026-09-28 10:00',
      '2026-09-30 10:00',
    ]);
  });

  it('honours INTERVAL with BYDAY', () => {
    expect(expand('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO;COUNT=3', d(2026, 9, 21, 10), d(2026, 9, 1), d(2026, 12, 31))).toEqual([
      '2026-09-21 10:00',
      '2026-10-05 10:00',
      '2026-10-19 10:00',
    ]);
  });

  it('stops at UNTIL and at the window end', () => {
    expect(
      expand('FREQ=WEEKLY;BYDAY=MO,FR;UNTIL=20261002', d(2026, 9, 21, 10), d(2026, 9, 1), d(2026, 12, 31)),
    ).toEqual(['2026-09-21 10:00', '2026-09-25 10:00', '2026-09-28 10:00', '2026-10-02 10:00']);
    expect(expand('FREQ=WEEKLY;BYDAY=MO,FR', d(2026, 9, 21, 10), d(2026, 9, 1), d(2026, 9, 27))).toEqual([
      '2026-09-21 10:00',
      '2026-09-25 10:00',
    ]);
  });

  it('only returns occurrences inside a later window', () => {
    expect(expand('FREQ=WEEKLY;BYDAY=TU,TH', d(2026, 1, 6, 9), d(2026, 9, 21), d(2026, 9, 27, 23, 59))).toEqual([
      '2026-09-22 09:00',
      '2026-09-24 09:00',
    ]);
  });

  it('keeps the wall-clock time across a DST change', () => {
    expect(expand('FREQ=WEEKLY;BYDAY=SA,SU;COUNT=4', d(2026, 10, 24, 18), d(2026, 10, 1), d(2026, 11, 30))).toEqual([
      '2026-10-24 18:00',
      '2026-10-25 18:00',
      '2026-10-31 18:00',
      '2026-11-01 18:00',
    ]);
  });
});

describe('expandRRule — MONTHLY / YEARLY', () => {
  it('repeats on the same day of month across a year boundary', () => {
    expect(expand('FREQ=MONTHLY', d(2026, 11, 15, 12), d(2026, 11, 1), d(2027, 2, 28))).toEqual([
      '2026-11-15 12:00',
      '2026-12-15 12:00',
      '2027-01-15 12:00',
      '2027-02-15 12:00',
    ]);
  });

  it('skips months that have no such day instead of drifting (RFC 5545)', () => {
    // Regression: stepping with setMonth overflowed 31 Jan → 3 March, and
    // every later occurrence then fell on the 3rd.
    expect(expand('FREQ=MONTHLY', d(2026, 1, 31, 10), d(2026, 1, 1), d(2027, 1, 1))).toEqual([
      '2026-01-31 10:00',
      '2026-03-31 10:00',
      '2026-05-31 10:00',
      '2026-07-31 10:00',
      '2026-08-31 10:00',
      '2026-10-31 10:00',
      '2026-12-31 10:00',
    ]);
  });

  it('does not count skipped months towards COUNT', () => {
    expect(expand('FREQ=MONTHLY;COUNT=3', d(2026, 1, 30, 10), d(2026, 1, 1), d(2027, 12, 31))).toEqual([
      '2026-01-30 10:00',
      '2026-03-30 10:00',
      '2026-04-30 10:00',
    ]);
  });

  it('honours INTERVAL', () => {
    expect(expand('FREQ=MONTHLY;INTERVAL=3;COUNT=4', d(2026, 9, 24), d(2026, 1, 1), d(2028, 1, 1))).toEqual([
      '2026-09-24 00:00',
      '2026-12-24 00:00',
      '2027-03-24 00:00',
      '2027-06-24 00:00',
    ]);
  });

  it('repeats yearly on the same date', () => {
    expect(expand('FREQ=YEARLY;COUNT=3', d(2026, 9, 24, 8), d(2026, 1, 1), d(2035, 1, 1))).toEqual([
      '2026-09-24 08:00',
      '2027-09-24 08:00',
      '2028-09-24 08:00',
    ]);
  });

  it('only emits a 29 February anniversary in leap years', () => {
    expect(expand('FREQ=YEARLY', d(2024, 2, 29, 9), d(2024, 1, 1), d(2033, 12, 31))).toEqual([
      '2024-02-29 09:00',
      '2028-02-29 09:00',
      '2032-02-29 09:00',
    ]);
  });

  it('never clamps a skipped month onto its last day', () => {
    // A February window for a "31st of the month" rule has no occurrence —
    // not 28 February.
    expect(expand('FREQ=MONTHLY', d(2027, 1, 31, 10), d(2027, 2, 1), d(2027, 2, 28, 23, 59))).toEqual([]);
  });

  it('terminates when the window ends inside a run of skipped candidates', () => {
    // From 29 Feb 2028 the next three candidates (2029–2031) are all invalid;
    // the window ends before the next leap year, so expansion must stop there.
    expect(expand('FREQ=YEARLY', d(2028, 2, 29), d(2029, 1, 1), d(2031, 12, 31))).toEqual([]);
  });
});

describe('isException', () => {
  it('matches by calendar day, ignoring the time of day', () => {
    expect(isException(d(2026, 9, 24, 10), [d(2026, 9, 24, 0)])).toBe(true);
    expect(isException(d(2026, 9, 24, 10), [d(2026, 9, 23), d(2026, 9, 25)])).toBe(false);
  });

  it('is false without exceptions', () => {
    expect(isException(d(2026, 9, 24), undefined)).toBe(false);
    expect(isException(d(2026, 9, 24), [])).toBe(false);
  });
});
