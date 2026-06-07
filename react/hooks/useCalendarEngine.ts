import { useContext } from 'react';
import { CalendarEngineContext } from '../CalendarEngineContext';
import type { CalendarEngine } from '../../modules/calendar/calendar.engine';

export function useCalendarEngine(): CalendarEngine {
  const engine = useContext(CalendarEngineContext);
  if (!engine) throw new Error('useCalendarEngine must be used inside <Calendar />');
  return engine;
}
