import { useStore } from 'zustand/react';
import { useCalendarEngine } from './useCalendarEngine.js';
import type { CalendarStore, CalendarStoreApi } from '../../modules/calendar/calendar.store.js';

export function useCalStore<T>(selector: (s: CalendarStore) => T): T {
  const engine = useCalendarEngine();
  return useStore(engine.store, selector);
}

export function useCalStoreApi(): CalendarStoreApi {
  const engine = useCalendarEngine();
  return engine.store;
}
