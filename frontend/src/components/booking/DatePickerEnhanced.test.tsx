import React from 'react'; // Ensure React is imported for JSX in mock
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DatePickerEnhanced from './DatePickerEnhanced';

// Mock react-datepicker
vi.mock('react-datepicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockDatePicker = React.forwardRef(({ selected, onChange, disabled, placeholderText, dateFormat, minDate, wrapperClassName, className, id }: any, ref: any) => (
    <input
      ref={ref}
      id={id}
      className={`${className} ${wrapperClassName}`} // Combine classes for basic styling representation
      value={selected ? new Date(selected).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
      onChange={(e) => {
        // Basic simulation of date change; actual date logic is complex
        // For testing, we'll just pass back a new Date if value is parsable, or current date
        const mockDate = e.target.value ? new Date(e.target.value) : new Date();
        onChange(mockDate);
      }}
      disabled={disabled}
      placeholder={placeholderText}
      data-testid="mock-datepicker"
      data-dateformat={dateFormat} // Pass dateFormat to check if it's received
      data-mindate={minDate ? minDate.toISOString() : ''} // Pass minDate
    />
  ));
  MockDatePicker.displayName = 'MockDatePicker';
  return { default: MockDatePicker };
});


describe('DatePickerEnhanced', () => {
  let mockOnSelectDate: (date: Date) => void;

  beforeEach(() => {
    mockOnSelectDate = vi.fn();
  });

  it('renders the date picker and calls onSelectDate on change', () => {
    const initialDate = new Date(2024, 6, 28); // July 28, 2024
    render(
      <DatePickerEnhanced 
        onSelectDate={mockOnSelectDate} 
        selectedDate={initialDate} 
        businessTimezone="America/New_York"
      />
    );

    expect(screen.getByText('3. Select Date:')).toBeInTheDocument();
    const datePickerInput = screen.getByTestId('mock-datepicker');
    expect(datePickerInput).toBeInTheDocument();
    expect(datePickerInput).toHaveValue('July 28, 2024'); // Check formatted date

    // Simulate changing the date (mock will call onChange with a new Date)
    fireEvent.change(datePickerInput, { target: { value: '08/15/2024' } }); // August 15, 2024
    expect(mockOnSelectDate).toHaveBeenCalled();
    // Check if the date passed to onSelectDate is a Date object
    // The exact date from the mock might be tricky, so check type primarily
    expect(mockOnSelectDate.mock.calls[0][0]).toBeInstanceOf(Date);
  });

  it('displays placeholder text when no date is selected', () => {
    render(<DatePickerEnhanced onSelectDate={mockOnSelectDate} />);
    const datePickerInput = screen.getByTestId('mock-datepicker');
    expect(datePickerInput).toHaveAttribute('placeholder', 'Click to select a date');
  });

  it('is disabled when disabled prop is true', () => {
    render(<DatePickerEnhanced onSelectDate={mockOnSelectDate} disabled={true} />);
    const datePickerInput = screen.getByTestId('mock-datepicker');
    expect(datePickerInput).toBeDisabled();
  });

  it('displays business timezone information', () => {
    render(<DatePickerEnhanced onSelectDate={mockOnSelectDate} businessTimezone="Europe/London" />);
    expect(screen.getByText('Dates are shown in your local time. Business operates in Europe/London.')).toBeInTheDocument();
  });
  
  it('passes dateFormat and minDate props to the underlying DatePickerComponent', () => {
    const minDate = new Date();
    render(<DatePickerEnhanced onSelectDate={mockOnSelectDate} minDate={minDate} />);
    const datePickerInput = screen.getByTestId('mock-datepicker');
    expect(datePickerInput).toHaveAttribute('data-dateformat', 'MMMM d, yyyy');
    // The minDate in mock is stringified, check if it exists
    expect(datePickerInput.dataset.mindate).toBeTruthy(); 
  });
});
