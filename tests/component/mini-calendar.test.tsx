import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MiniCalendar } from '../../react';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 24, 10));
});
afterEach(() => { vi.useRealTimers(); });

describe('<MiniCalendar />', () => {
  it('renders standalone (no <Calendar /> needed) on the month of its value', () => {
    render(<MiniCalendar value={d(2026, 3, 8)} locale="en" />);
    expect(screen.getByRole('application', { name: 'March 2026' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
  });

  it('selects the value and reports clicked days', () => {
    const onChange = vi.fn();
    render(<MiniCalendar value={d(2026, 9, 24)} onChange={onChange} locale="en" />);
    const selected = screen.getAllByRole('gridcell').filter((c) => c.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('24');

    fireEvent.click(screen.getByRole('gridcell', { name: '15' }));
    expect(onChange).toHaveBeenCalledWith(d(2026, 9, 15));
  });

  it('defaults to the current month and pages without skipping short months', () => {
    render(<MiniCalendar locale="en" />);
    expect(screen.getByRole('application', { name: 'September 2026' })).toBeInTheDocument();
    for (const expected of ['October 2026', 'November 2026', 'December 2026', 'January 2027', 'February 2027']) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByRole('application')).toHaveAccessibleName(expected);
    }
  });

  it('pages from the 31st into February', () => {
    render(<MiniCalendar value={d(2026, 1, 31)} locale="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('application')).toHaveAccessibleName('February 2026');
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('application')).toHaveAccessibleName('December 2025');
  });

  it('uses a Monday week start in Turkish', () => {
    render(<MiniCalendar value={d(2026, 9, 24)} locale="tr" />);
    // September 2026 starts on a Tuesday → the grid opens on Monday 31 August.
    expect(screen.getAllByRole('gridcell')[0]).toHaveTextContent('31');
    expect(screen.getByRole('application')).toHaveAccessibleName('Eylül 2026');
  });
});
