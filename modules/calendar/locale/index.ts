import type { CalendarMessages } from '../calendar.types';
import { TR_MESSAGES, TR_WEEK_START, TR_MONTH_NAMES, TR_DAY_SHORT, TR_DAY_LONG } from './tr';
import { EN_MESSAGES, EN_WEEK_START, EN_MONTH_NAMES, EN_DAY_SHORT, EN_DAY_LONG } from './en';

export type LocaleBundle = {
  messages: CalendarMessages;
  weekStart: 0 | 1;
  monthNames: string[];
  dayShort: string[];
  dayLong: string[];
};

export function resolveLocale(code?: string): LocaleBundle {
  const c = (code ?? 'tr').toLowerCase().slice(0, 2);
  if (c === 'en') {
    return {
      messages: EN_MESSAGES,
      weekStart: EN_WEEK_START as 0,
      monthNames: EN_MONTH_NAMES,
      dayShort: EN_DAY_SHORT,
      dayLong: EN_DAY_LONG,
    };
  }
  return {
    messages: TR_MESSAGES,
    weekStart: TR_WEEK_START as 1,
    monthNames: TR_MONTH_NAMES,
    dayShort: TR_DAY_SHORT,
    dayLong: TR_DAY_LONG,
  };
}

export function mergeMessages(
  base: CalendarMessages,
  overrides?: Partial<CalendarMessages>,
): CalendarMessages {
  if (!overrides) return base;
  return { ...base, ...overrides };
}
