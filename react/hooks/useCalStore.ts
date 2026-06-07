import { useStore } from 'zustand/react';
import { useCalendarEngine } from './useCalendarEngine';
import type { CalendarStore, CalendarStoreApi } from '../../modules/calendar/calendar.store';

export function useCalStore<T>(selector: (s: CalendarStore) => T): T {
  const engine = useCalendarEngine();
  return useStore(engine.store, selector);
}

export function useCalStoreApi(): CalendarStoreApi {
  const engine = useCalendarEngine();
  return engine.store;
}
