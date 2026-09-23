import { describe, expect, it } from 'vitest';
import { mergeMessages, resolveLocale } from '../../modules/calendar/locale';
import { EVENT_COLOR_CLASSES, effectiveColor, resolveColor } from '../../modules/calendar/calendar.colors';
import type { EventColor } from '../../modules/calendar/calendar.types';

describe('resolveLocale', () => {
  it('defaults to Turkish with a Monday week start', () => {
    const tr = resolveLocale();
    expect(tr.weekStart).toBe(1);
    expect(tr.messages.today).toBe('Bugün');
    expect(tr.monthNames[8]).toBe('Eylül');
  });

  it('matches English by language prefix, case-insensitively', () => {
    for (const code of ['en', 'EN', 'en-US', 'en_GB']) {
      const en = resolveLocale(code);
      expect(en.weekStart).toBe(0);
      expect(en.messages.today).toBe('Today');
    }
  });

  it('falls back to Turkish for unsupported languages', () => {
    expect(resolveLocale('de-DE').messages.today).toBe('Bugün');
  });

  it('ships complete, consistently-sized tables', () => {
    for (const code of ['en', 'tr']) {
      const b = resolveLocale(code);
      expect(b.monthNames).toHaveLength(12);
      expect(b.dayShort).toHaveLength(7);
      expect(b.dayLong).toHaveLength(7);
      expect(new Set(b.monthNames).size).toBe(12);
    }
  });

  it('pluralises the English cell label and formats dynamic messages', () => {
    const { messages } = resolveLocale('en');
    expect(messages.cellLabel('Thursday 24 September', 0)).toBe('Thursday 24 September, no events');
    expect(messages.cellLabel('Thursday 24 September', 1)).toBe('Thursday 24 September, 1 event');
    expect(messages.cellLabel('Thursday 24 September', 3)).toBe('Thursday 24 September, 3 events');
    expect(messages.more(2)).toBe('+2 more');
    expect(messages.showing('September 2026')).toBe('Showing September 2026');
  });

  it('formats Turkish dynamic messages', () => {
    const { messages } = resolveLocale('tr');
    expect(messages.cellLabel('Perşembe 24 Eylül', 0)).toBe('Perşembe 24 Eylül, etkinlik yok');
    expect(messages.cellLabel('Perşembe 24 Eylül', 2)).toBe('Perşembe 24 Eylül, 2 etkinlik');
    expect(messages.more(4)).toBe('+4 daha');
  });
});

describe('mergeMessages', () => {
  const base = resolveLocale('en').messages;

  it('returns the base bundle unchanged without overrides', () => {
    expect(mergeMessages(base)).toBe(base);
  });

  it('overrides only the given keys, including function messages', () => {
    const merged = mergeMessages(base, { today: 'Now', more: (n) => `${n} extra` });
    expect(merged.today).toBe('Now');
    expect(merged.more(5)).toBe('5 extra');
    expect(merged.next).toBe('Next');
    expect(base.today).toBe('Today');
  });
});

describe('event colours', () => {
  it('defines classes for every colour', () => {
    const colors: EventColor[] = ['primary', 'success', 'warning', 'error', 'info', 'secondary', 'neutral'];
    for (const c of colors) {
      const cls = EVENT_COLOR_CLASSES[c];
      expect(cls.pill && cls.bar && cls.fg && cls.dot).toBeTruthy();
    }
  });

  it('resolves a missing colour to primary', () => {
    expect(resolveColor()).toBe('primary');
    expect(resolveColor('warning')).toBe('warning');
  });

  it('prefers the event colour, then its calendar colour, then primary', () => {
    const calendars = [{ id: 'work', color: 'info' as const }];
    expect(effectiveColor({ color: 'error', calendarId: 'work' }, calendars)).toBe('error');
    expect(effectiveColor({ calendarId: 'work' }, calendars)).toBe('info');
    expect(effectiveColor({ calendarId: 'missing' }, calendars)).toBe('primary');
    expect(effectiveColor({ calendarId: 'work' })).toBe('primary');
    expect(effectiveColor({})).toBe('primary');
  });
});
