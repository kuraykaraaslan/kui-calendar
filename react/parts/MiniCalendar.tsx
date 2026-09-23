import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { cn } from '../../libs/utils/cn.js';
import { addMonths, isSameDay, isSameMonth, monthGrid } from '../../modules/calendar/calendar.date-utils.js';
import { resolveLocale } from '../../modules/calendar/locale/index.js';

type MiniCalendarProps = {
  value?: Date;
  onChange?: (d: Date) => void;
  locale?: string;
  className?: string;
};

export function MiniCalendar({ value, onChange, locale, className }: MiniCalendarProps) {
  const bundle = useMemo(() => resolveLocale(locale), [locale]);
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState<Date>(() => value ?? today);

  const cells = useMemo(() => monthGrid(anchor, bundle.weekStart), [anchor, bundle.weekStart]);
  const headerOrder = useMemo(
    () => Array.from({ length: 7 }, (_, i) => (i + bundle.weekStart) % 7),
    [bundle.weekStart],
  );

  const pageMonth = (delta: number) => setAnchor((d) => addMonths(d, delta));

  return (
    <div
      className={cn(
        'inline-flex flex-col w-60 rounded-lg border border-border bg-surface-base overflow-hidden',
        className,
      )}
      role="application"
      aria-label={`${bundle.monthNames[anchor.getMonth()]} ${anchor.getFullYear()}`}
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-surface-raised">
        <button
          type="button"
          onClick={() => pageMonth(-1)}
          aria-label={bundle.messages.previous}
          className="inline-flex items-center justify-center w-6 h-6 rounded text-text-secondary hover:bg-surface-overlay hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-2.5 h-2.5" aria-hidden="true" />
        </button>
        <span className="text-xs font-semibold text-text-primary tabular-nums">
          {bundle.monthNames[anchor.getMonth()]} {anchor.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => pageMonth(1)}
          aria-label={bundle.messages.next}
          className="inline-flex items-center justify-center w-6 h-6 rounded text-text-secondary hover:bg-surface-overlay hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 px-1 py-1">
        {headerOrder.map((dayIdx) => (
          <div
            key={dayIdx}
            className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary text-center"
          >
            {bundle.dayShort[dayIdx]?.[0]}
          </div>
        ))}
      </div>

      <div role="grid" className="grid grid-cols-7 px-1 pb-1 gap-0.5">
        {cells.map((cell) => {
          const inMonth = isSameMonth(cell, anchor);
          const isToday = isSameDay(cell, today);
          const isSelected = value ? isSameDay(cell, value) : false;
          return (
            <button
              key={cell.toISOString()}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              onClick={() => onChange?.(cell)}
              className={cn(
                'inline-flex items-center justify-center h-6 w-6 mx-auto rounded-full text-[11px] tabular-nums',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                'transition-colors',
                !inMonth && 'text-text-disabled',
                inMonth && !isSelected && !isToday && 'text-text-primary hover:bg-surface-overlay',
                isToday && !isSelected && 'text-primary font-semibold ring-1 ring-primary',
                isSelected && 'bg-primary text-primary-fg font-semibold',
              )}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
