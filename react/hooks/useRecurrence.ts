import { useMemo } from 'react';
import type { CalendarEvent, EventOccurrence } from '../../modules/calendar/calendar.types';
import { expandRRule, isException, parseRRule } from '../../modules/calendar/calendar.rrule';

/**
 * Expand RRULE events into concrete occurrences inside the window. With
 * `enabled` false, events are returned as-is, so a recurring event shows
 * once, at its own start (its base occurrence).
 */
export function useRecurrence(
  events: CalendarEvent[],
  windowStart: Date,
  windowEnd: Date,
  enabled = true,
): EventOccurrence[] {
  return useMemo(() => {
    if (!enabled) return events;
    const out: EventOccurrence[] = [];
    for (const ev of events) {
      if (!ev.rrule) {
        out.push(ev);
        continue;
      }
      let parsed;
      try {
        parsed = parseRRule(ev.rrule);
      } catch {
        out.push(ev);
        continue;
      }
      const duration = ev.end.getTime() - ev.start.getTime();
      const occurrences = expandRRule(parsed, ev.start, windowStart, windowEnd);
      for (const start of occurrences) {
        if (isException(start, ev.exceptions)) continue;
        out.push({
          ...ev,
          id: `${ev.id}::${start.toISOString()}`,
          start,
          end: new Date(start.getTime() + duration),
          parentId: ev.id,
          originalStart: start,
          isRecurrence: true,
        });
      }
    }
    return out;
  }, [events, enabled, windowStart.getTime(), windowEnd.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps
}
