import { createStore } from 'zustand/vanilla';
import type {
  CalendarDragState,
  CalendarPopoverState,
  CalendarSource,
  CalendarEvent,
  View,
} from './calendar.types.js';

export type CalendarState = {
  date: Date;
  view: View;
  popover: CalendarPopoverState;
  drag: CalendarDragState;
  calendars: CalendarSource[];
  hiddenCalendarIds: Set<string>;
};

export type CalendarActions = {
  setDate: (d: Date) => void;
  setView: (v: View) => void;
  openPopover: (event: CalendarEvent, anchorRect: DOMRect) => void;
  closePopover: () => void;
  setDrag: (d: CalendarDragState) => void;
  setCalendars: (cals: CalendarSource[]) => void;
  toggleCalendar: (id: string) => void;
};

export type CalendarStore = CalendarState & CalendarActions;

const IDLE_DRAG: CalendarDragState = { kind: 'idle' };
const EMPTY_POPOVER: CalendarPopoverState = { event: null, anchorRect: null };

export function createCalendarStore(initial: { date: Date; view: View }) {
  return createStore<CalendarStore>((set) => ({
    date: initial.date,
    view: initial.view,
    popover: EMPTY_POPOVER,
    drag: IDLE_DRAG,
    calendars: [],
    hiddenCalendarIds: new Set<string>(),

    setDate: (d) => set({ date: d }),
    setView: (v) => set({ view: v }),

    openPopover: (event, anchorRect) => set({ popover: { event, anchorRect } }),
    closePopover: () => set({ popover: EMPTY_POPOVER }),

    setDrag: (d) => set({ drag: d }),

    setCalendars: (cals) => set({ calendars: cals }),
    toggleCalendar: (id) =>
      set((s) => {
        const next = new Set(s.hiddenCalendarIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { hiddenCalendarIds: next };
      }),
  }));
}

export type CalendarStoreApi = ReturnType<typeof createCalendarStore>;
