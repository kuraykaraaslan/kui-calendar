import { addDays, addMonths, isSameDay, startOfDay } from './calendar.date-utils';

export type RRuleFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type ParsedRRule = {
  freq: RRuleFreq;
  interval: number;
  count?: number;
  until?: Date;
  byDay?: number[];
};

const DAY_MAP: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

export function parseRRule(input: string): ParsedRRule {
  const parts = input.trim().split(';').map((p) => p.trim()).filter(Boolean);
  const map = new Map<string, string>();
  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq < 0) continue;
    map.set(p.slice(0, eq).toUpperCase(), p.slice(eq + 1));
  }
  const freq = map.get('FREQ') as RRuleFreq | undefined;
  if (!freq || !['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) {
    throw new Error(`Invalid RRULE: missing or unsupported FREQ ("${input}")`);
  }
  const interval = Math.max(1, Number(map.get('INTERVAL') ?? '1') || 1);
  const count = map.has('COUNT') ? Math.max(1, Number(map.get('COUNT'))) : undefined;
  const until = map.has('UNTIL') ? parseUntil(map.get('UNTIL')!) : undefined;
  const byDay = map.has('BYDAY')
    ? map.get('BYDAY')!.split(',').map((d) => DAY_MAP[d.trim().toUpperCase()] ?? -1).filter((n) => n >= 0)
    : undefined;
  return { freq, interval, count, until, byDay };
}

function parseUntil(raw: string): Date {
  const v = raw.trim();
  if (/^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const m = Number(v.slice(4, 6)) - 1;
    const d = Number(v.slice(6, 8));
    return new Date(y, m, d, 23, 59, 59, 999);
  }
  if (/^\d{8}T\d{6}Z?$/.test(v)) {
    const iso = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(9, 11)}:${v.slice(11, 13)}:${v.slice(13, 15)}${v.endsWith('Z') ? 'Z' : ''}`;
    return new Date(iso);
  }
  return new Date(v);
}

export function expandRRule(
  rule: ParsedRRule,
  dtstart: Date,
  windowStart: Date,
  windowEnd: Date,
  hardCap = 1000,
): Date[] {
  const out: Date[] = [];
  const stopAt = rule.until && rule.until.getTime() < windowEnd.getTime() ? rule.until : windowEnd;
  let produced = 0;

  function emitIfInWindow(d: Date) {
    produced += 1;
    if (d.getTime() >= windowStart.getTime() && d.getTime() <= stopAt.getTime()) {
      out.push(d);
    }
  }

  if (rule.freq === 'WEEKLY' && rule.byDay && rule.byDay.length > 0) {
    const weekDays = [...rule.byDay].sort((a, b) => a - b);
    let weekAnchor = startOfDay(dtstart);
    weekAnchor = addDays(weekAnchor, -dtstart.getDay());
    while (out.length < hardCap && (!rule.count || produced < rule.count)) {
      for (const wd of weekDays) {
        const occ = withTimeOfDay(addDays(weekAnchor, wd), dtstart);
        if (occ.getTime() < dtstart.getTime()) continue;
        if (occ.getTime() > stopAt.getTime()) return out;
        emitIfInWindow(occ);
        if (rule.count && produced >= rule.count) return out;
      }
      weekAnchor = addDays(weekAnchor, 7 * rule.interval);
      if (weekAnchor.getTime() > stopAt.getTime()) return out;
    }
    return out;
  }

  let cursor = new Date(dtstart);
  while (out.length < hardCap && cursor.getTime() <= stopAt.getTime()) {
    emitIfInWindow(cursor);
    if (rule.count && produced >= rule.count) return out;
    cursor = stepFreq(cursor, rule.freq, rule.interval);
  }
  return out;
}

function stepFreq(d: Date, freq: RRuleFreq, interval: number): Date {
  switch (freq) {
    case 'DAILY': return addDays(d, interval);
    case 'WEEKLY': return addDays(d, 7 * interval);
    case 'MONTHLY': return addMonths(d, interval);
    case 'YEARLY': {
      const x = new Date(d);
      x.setFullYear(x.getFullYear() + interval);
      return x;
    }
  }
}

function withTimeOfDay(day: Date, time: Date): Date {
  const x = new Date(day);
  x.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
  return x;
}

export function isException(d: Date, exceptions: Date[] | undefined): boolean {
  if (!exceptions || exceptions.length === 0) return false;
  return exceptions.some((ex) => isSameDay(ex, d));
}
