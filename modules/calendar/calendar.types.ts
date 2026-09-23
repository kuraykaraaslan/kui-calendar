import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type View = 'month' | 'week' | 'day' | 'agenda' | 'resource';

export type EventColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'secondary'
  | 'neutral';

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  icon?: IconDefinition;
  description?: string;
  calendarId?: string;
  rrule?: string;
  exceptions?: Date[];
  resourceId?: string;
};

export type EventOccurrence = CalendarEvent & {
  parentId?: string;
  originalStart?: Date;
  isRecurrence?: boolean;
};

export type Resource = {
  id: string;
  name: string;
  color?: EventColor;
};

export type CalendarMessages = {
  today: string;
  previous: string;
  next: string;
  month: string;
  week: string;
  day: string;
  agenda: string;
  resource: string;
  allDay: string;
  noEvents: string;
  more: (n: number) => string;
  edit: string;
  delete: string;
  confirmDelete: string;
  close: string;
  calendars: string;
  noResources: string;
  search: string;
  showing: (periodLabel: string) => string;
  cellLabel: (dateLabel: string, eventCount: number) => string;
};

export type WorkingHours = {
  start: number;
  end: number;
  days: number[];
};

export type CalendarPopoverState = {
  event: CalendarEvent | null;
  anchorRect: DOMRect | null;
};

export type CalendarDragState =
  | { kind: 'idle' }
  | { kind: 'move'; eventId: string; ghostStart: Date; ghostEnd: Date; dayIndex: number }
  | { kind: 'resize'; eventId: string; ghostEnd: Date }
  | { kind: 'create'; ghostStart: Date; ghostEnd: Date; dayIndex: number };

export type CalendarTelemetry =
  | { type: 'view-change'; view: View }
  | { type: 'nav'; date: Date; direction: 'prev' | 'next' | 'today' }
  | { type: 'event-click'; eventId: string }
  | { type: 'event-create'; start: Date; end: Date }
  | { type: 'event-update'; eventId: string }
  | { type: 'event-delete'; eventId: string }
  | { type: 'calendar-toggle'; calendarId: string; visible: boolean };

export type CalendarSource = {
  id: string;
  name: string;
  color: EventColor;
};

export type CalendarProps = {
  events: CalendarEvent[];
  view?: View;
  defaultDate?: Date;
  onViewChange?: (v: View) => void;
  onDateChange?: (d: Date) => void;
  onEventClick?: (e: CalendarEvent) => void;
  onEventCreate?: (range: { start: Date; end: Date }) => void | Promise<void>;
  onEventUpdate?: (event: CalendarEvent) => void | Promise<void>;
  onEventDelete?: (id: string) => void | Promise<void>;
  resources?: Resource[];
  calendars?: CalendarSource[];
  onCalendarToggle?: (calendarId: string, visible: boolean) => void;
  hideCalendarLegend?: boolean;
  /**
   * Expand `rrule` events into their occurrences. Default `false`: a
   * recurring event is shown once, at its own `start`.
   */
  recurrence?: boolean;
  locale?: string;
  messages?: Partial<CalendarMessages>;
  workingHours?: WorkingHours;
  slotMinutes?: 5 | 15 | 30 | 60;
  reducedMotion?: boolean;
  timezone?: string;
  onTelemetry?: (e: CalendarTelemetry) => void;
  className?: string;
};

export type CalendarHandle = {
  goToToday: () => void;
  goPrev: () => void;
  goNext: () => void;
  setView: (v: View) => void;
};
