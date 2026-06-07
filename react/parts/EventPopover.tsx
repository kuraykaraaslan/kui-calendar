import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { cn } from '../../libs/utils/cn';
import type { CalendarMessages, CalendarTelemetry, CalendarEvent } from '../../modules/calendar/calendar.types';
import { effectiveColor, EVENT_COLOR_CLASSES } from '../../modules/calendar/calendar.colors';
import { fmtTimeRange } from '../../modules/calendar/calendar.date-utils';
import { useCalStore } from '../hooks/useCalStore';

const POPOVER_W = 280;
const POPOVER_GAP = 8;

type Placement = { top: number; left: number; placement: 'below' | 'above' };

function computePlacement(anchor: DOMRect, popoverHeight: number): Placement {
  if (typeof window === 'undefined') return { top: 0, left: 0, placement: 'below' };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - anchor.bottom;
  const placement: 'below' | 'above' =
    spaceBelow >= popoverHeight + POPOVER_GAP ? 'below' : 'above';

  const top =
    placement === 'below'
      ? anchor.bottom + POPOVER_GAP
      : Math.max(POPOVER_GAP, anchor.top - popoverHeight - POPOVER_GAP);

  let left = anchor.left + anchor.width / 2 - POPOVER_W / 2;
  left = Math.max(POPOVER_GAP, Math.min(left, vw - POPOVER_W - POPOVER_GAP));

  return { top, left, placement };
}

type EventPopoverProps = {
  messages: CalendarMessages;
  onEventUpdate?: (event: CalendarEvent) => void | Promise<void>;
  onEventDelete?: (id: string) => void | Promise<void>;
  onTelemetry?: (e: CalendarTelemetry) => void;
};

export function EventPopover({ messages, onEventUpdate, onEventDelete, onTelemetry }: EventPopoverProps) {
  const popover = useCalStore((s) => s.popover);
  const closePopover = useCalStore((s) => s.closePopover);
  const calendars = useCalStore((s) => s.calendars);
  const event = popover.event;
  const anchorRect = popover.anchorRect;
  const calendarName =
    event?.calendarId ? (calendars.find((c) => c.id === event.calendarId)?.name ?? null) : null;

  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Placement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setConfirmDelete(false); }, [event?.id]);

  useLayoutEffect(() => {
    if (!event || !anchorRect || !ref.current) return;
    const h = ref.current.getBoundingClientRect().height;
    setPos(computePlacement(anchorRect, h));
  }, [event, anchorRect]);

  useEffect(() => {
    if (!event) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); closePopover(); }
    }
    function onPointer(e: PointerEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      closePopover();
    }
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [event, closePopover]);

  if (!event || typeof document === 'undefined') return null;

  const color = effectiveColor(event, calendars);
  const dot = EVENT_COLOR_CLASSES[color].dot;
  const timeLabel = event.allDay ? messages.allDay : fmtTimeRange(event.start, event.end);

  const handleEdit = () => {
    onEventUpdate?.(event);
    onTelemetry?.({ type: 'event-update', eventId: event.id });
    closePopover();
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onEventDelete?.(event.id);
    onTelemetry?.({ type: 'event-delete', eventId: event.id });
    closePopover();
  };

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`cal-pop-${event.id}-title`}
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: POPOVER_W,
        visibility: pos ? 'visible' : 'hidden',
        zIndex: 60,
      }}
      className={cn('rounded-lg border border-border bg-surface-base shadow-lg', 'p-3 flex flex-col gap-2')}
    >
      <div className="flex items-start gap-2">
        <span className={cn('mt-1.5 w-2.5 h-2.5 rounded-full shrink-0', dot)} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h3 id={`cal-pop-${event.id}-title`} className="text-sm font-semibold text-text-primary truncate">
            {event.title}
          </h3>
          <p className="text-xs text-text-secondary tabular-nums">{timeLabel}</p>
          {calendarName && <p className="text-[11px] text-text-disabled truncate mt-0.5">{calendarName}</p>}
        </div>
        <button
          type="button"
          onClick={closePopover}
          aria-label={messages.close}
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded',
            'text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
          )}
        >
          <FontAwesomeIcon icon={faXmark} className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>

      {event.description && (
        <p className="text-xs text-text-secondary whitespace-pre-wrap">{event.description}</p>
      )}

      <div className="flex items-center justify-end gap-1.5 pt-1">
        <button
          type="button"
          onClick={handleEdit}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
            'border border-border bg-surface-base text-text-primary',
            'hover:bg-surface-overlay transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
          )}
        >
          <FontAwesomeIcon icon={faPenToSquare} className="w-3 h-3" aria-hidden="true" />
          <span>{messages.edit}</span>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
            confirmDelete
              ? 'bg-error text-primary-fg hover:opacity-90'
              : 'border border-border text-error hover:bg-error-subtle',
          )}
        >
          <FontAwesomeIcon icon={faTrash} className="w-3 h-3" aria-hidden="true" />
          <span>{confirmDelete ? messages.confirmDelete : messages.delete}</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
