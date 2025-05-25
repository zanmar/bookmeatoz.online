import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import TimeSlotPicker from './TimeSlotPicker';
import { useTimezone } from '@/hooks/useTimezone';
import { TimeSlot } from '@/types';

// Mock useTimezone hook
vi.mock('@/hooks/useTimezone', () => ({
  useTimezone: vi.fn(),
}));

const mockSlots: TimeSlot[] = [
  { start_time: '2024-07-28T14:00:00Z', end_time: '2024-07-28T15:00:00Z', is_available: true, employee_id: 'emp1' },
  { start_time: '2024-07-28T15:00:00Z', end_time: '2024-07-28T16:00:00Z', is_available: true },
  { start_time: '2024-07-28T16:00:00Z', end_time: '2024-07-28T17:00:00Z', is_available: false }, // Not available
];

describe('TimeSlotPicker', () => {
  let mockOnSelectSlot: (slot: TimeSlot) => void;
  const mockBusinessTimezone = 'America/New_York';
  const mockUserLocalTimezone = 'Europe/London'; // Example, can be same or different

  beforeEach(() => {
    mockOnSelectSlot = vi.fn();
    (useTimezone as vi.Mock).mockReturnValue({
      businessTimezone: mockBusinessTimezone,
      userLocalTimezone: mockUserLocalTimezone,
      formatInBusinessTimezone: (dateStr: string, formatStr: string) => {
        // Simple mock: just return time part for 'p' format
        if (formatStr === 'p') {
          const date = new Date(dateStr);
          return `${date.getUTCHours() % 12 || 12}:${String(date.getUTCMinutes()).padStart(2, '0')} ${date.getUTCHours() >= 12 ? 'PM' : 'AM'} (Mock BIZ TZ)`;
        }
        return dateStr;
      },
      formatInUserLocalTime: vi.fn( (dateStr, formatKey) => `${new Date(dateStr).toLocaleTimeString()} (Mock User TZ)`),
    });
  });

  it('renders time slots and handles selection', () => {
    render(
      <TimeSlotPicker 
        slots={mockSlots} 
        onSelectSlot={mockOnSelectSlot} 
        isLoadingSlots={false} 
        selectedSlotStartTime={mockSlots[0].start_time}
      />
    );

    expect(screen.getByText(/4. Pick an Available Time/)).toBeInTheDocument();
    expect(screen.getByText(`(shown in business timezone: ${mockBusinessTimezone.replace('_', ' ')})`)).toBeInTheDocument();

    const availableSlotButtons = screen.getAllByRole('button');
    // 2 available slots + 1 unavailable (which is also a button but disabled)
    expect(availableSlotButtons.length).toBe(mockSlots.length); 

    // Check content of one button
    expect(screen.getByText('2:00 PM (Mock BIZ TZ)')).toBeInTheDocument(); // Mocked formatted time

    // Click the second available slot
    fireEvent.click(availableSlotButtons[1]);
    expect(mockOnSelectSlot).toHaveBeenCalledWith(mockSlots[1]);

    // Check if the selected slot has the specific selected styles (simplified check)
    expect(availableSlotButtons[0].className).toContain('bg-primary text-white'); // Selected style
    expect(availableSlotButtons[1].className).not.toContain('bg-primary text-white'); // Not selected
  });

  it('shows "Please select a date first" message when disabled', () => {
    render(<TimeSlotPicker slots={[]} onSelectSlot={mockOnSelectSlot} isLoadingSlots={false} disabled={true} />);
    expect(screen.getByText('Please select a date first.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TimeSlotPicker slots={[]} onSelectSlot={mockOnSelectSlot} isLoadingSlots={true} />);
    expect(screen.getByText('Finding available slots...')).toBeInTheDocument();
  });

  it('shows "no time slots available" message when slots array is empty and not loading', () => {
    render(<TimeSlotPicker slots={[]} onSelectSlot={mockOnSelectSlot} isLoadingSlots={false} />);
    expect(screen.getByText('No time slots available for the selected date or criteria. Please try another date.')).toBeInTheDocument();
  });
  
  it('disables unavailable slots', () => {
    render(
      <TimeSlotPicker 
        slots={mockSlots} 
        onSelectSlot={mockOnSelectSlot} 
        isLoadingSlots={false} 
      />
    );
    const unavailableSlotButton = screen.getByText('4:00 PM (Mock BIZ TZ)'); // Content of the unavailable slot
    expect(unavailableSlotButton.closest('button')).toBeDisabled();
    expect(unavailableSlotButton.closest('button')).toHaveClass('opacity-60 cursor-not-allowed');
  });
});
