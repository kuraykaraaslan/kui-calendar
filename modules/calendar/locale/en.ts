import type { CalendarMessages } from '../calendar.types';

export const EN_MESSAGES: CalendarMessages = {
  today: 'Today',
  previous: 'Previous',
  next: 'Next',
  month: 'Month',
  week: 'Week',
  day: 'Day',
  agenda: 'Agenda',
  resource: 'Resource',
  allDay: 'All-day',
  noEvents: 'No events',
  more: (n) => `+${n} more`,
  edit: 'Edit',
  delete: 'Delete',
  confirmDelete: 'Confirm delete?',
  close: 'Close',
  calendars: 'Calendars',
  noResources: 'No resources defined',
  search: 'Search events…',
  showing: (label) => `Showing ${label}`,
  cellLabel: (date, count) =>
    count === 0 ? `${date}, no events` : count === 1 ? `${date}, 1 event` : `${date}, ${count} events`,
};

export const EN_WEEK_START = 0;

export const EN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const EN_DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const EN_DAY_LONG  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
