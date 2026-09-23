export { CalendarEngine } from './calendar/calendar.engine.js';
export type { CalendarEngineOptions } from './calendar/calendar.engine.js';

export { createCalendarStore } from './calendar/calendar.store.js';
export type {
  CalendarState,
  CalendarActions,
  CalendarStore,
  CalendarStoreApi,
} from './calendar/calendar.store.js';

export type {
  View,
  EventColor,
  CalendarEvent,
  EventOccurrence,
  Resource,
  CalendarMessages,
  WorkingHours,
  CalendarPopoverState,
  CalendarDragState,
  CalendarTelemetry,
  CalendarSource,
  CalendarProps,
  CalendarHandle,
} from './calendar/calendar.types.js';

export {
  EVENT_COLOR_CLASSES,
  resolveColor,
  effectiveColor,
} from './calendar/calendar.colors.js';

export {
  MS_DAY,
  HOUR_HEIGHT,
  MIN_EVENT_HEIGHT,
  startOfDay,
  endOfDay,
  isSameDay,
  isSameMonth,
  addDays,
  addMonths,
  startOfWeek,
  endOfWeek,
  rangeDays,
  monthGrid,
  eventOnDay,
  fmtTime,
  fmtTimeIntl,
  fmtTimeRange,
  minutesIntoDay,
  periodLabel,
  visibleWindow,
  snapMinutes,
  dateAtMinute,
} from './calendar/calendar.date-utils.js';

export {
  parseRRule,
  expandRRule,
  isException,
} from './calendar/calendar.rrule.js';
export type { RRuleFreq, ParsedRRule } from './calendar/calendar.rrule.js';

export {
  resolveLocale,
  mergeMessages,
} from './calendar/locale/index.js';
export type { LocaleBundle } from './calendar/locale/index.js';

export {
  yToMinutes,
  snapMinutesInt,
  hitTestDayColumn,
} from './calendar/calendar.drag-math.js';
