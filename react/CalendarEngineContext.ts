import { createContext } from 'react';
import type { CalendarEngine } from '../modules/calendar/calendar.engine';

export const CalendarEngineContext = createContext<CalendarEngine | null>(null);
