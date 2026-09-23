import { afterEach, describe, expect, it, vi } from 'vitest';
import { hitTestDayColumn, snapMinutesInt, yToMinutes } from '../../modules/calendar/calendar.drag-math';
import { HOUR_HEIGHT } from '../../modules/calendar/calendar.date-utils';

describe('yToMinutes', () => {
  const column = 24 * HOUR_HEIGHT;

  it('converts a pixel offset to minutes using the hour height', () => {
    expect(yToMinutes(0, column)).toBe(0);
    expect(yToMinutes(HOUR_HEIGHT, column)).toBe(60);
    expect(yToMinutes(HOUR_HEIGHT * 9.5, column)).toBe(570);
    expect(yToMinutes(HOUR_HEIGHT / 4, column)).toBe(15);
  });

  it('clamps to the column', () => {
    expect(yToMinutes(-50, column)).toBe(0);
    expect(yToMinutes(column + 500, column)).toBe(24 * 60);
  });
});

describe('snapMinutesInt', () => {
  it('snaps down to the slot size', () => {
    expect(snapMinutesInt(0, 30)).toBe(0);
    expect(snapMinutesInt(29, 30)).toBe(0);
    expect(snapMinutesInt(30, 30)).toBe(30);
    expect(snapMinutesInt(574, 15)).toBe(570);
    expect(snapMinutesInt(574, 5)).toBe(570);
    expect(snapMinutesInt(119, 60)).toBe(60);
  });
});

describe('hitTestDayColumn', () => {
  const original = document.elementFromPoint;
  afterEach(() => {
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: original });
    document.body.innerHTML = '';
  });

  const pointAt = (el: Element | null) =>
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => el) });

  it('finds the enclosing day column and its index', () => {
    document.body.innerHTML = '<div data-cal-day-index="3"><div><span id="inner"></span></div></div>';
    pointAt(document.getElementById('inner'));
    const hit = hitTestDayColumn(10, 20);
    expect(hit?.index).toBe(3);
    expect(hit?.col).toBe(document.querySelector('[data-cal-day-index]'));
    expect(document.elementFromPoint).toHaveBeenCalledWith(10, 20);
  });

  it('returns null outside any day column', () => {
    document.body.innerHTML = '<div id="elsewhere"></div>';
    pointAt(document.getElementById('elsewhere'));
    expect(hitTestDayColumn(0, 0)).toBeNull();
  });

  it('returns null when nothing is under the pointer', () => {
    pointAt(null);
    expect(hitTestDayColumn(0, 0)).toBeNull();
  });

  it('returns null for a malformed index', () => {
    document.body.innerHTML = '<div data-cal-day-index="nope" id="col"></div>';
    pointAt(document.getElementById('col'));
    expect(hitTestDayColumn(0, 0)).toBeNull();
  });
});
