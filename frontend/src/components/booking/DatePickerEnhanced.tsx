import React from 'react';
import DatePickerComponent from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// import { utcToZonedTime, format as formatWithTZ } from 'date-fns-tz'; // For advanced display

interface DatePickerEnhancedProps {
  onSelectDate: (date: Date) => void; // Emits JS Date object (user's local TZ)
  selectedDate?: Date;
  disabled?: boolean;
  businessTimezone?: string; // IANA timezone string, e.g., "America/New_York"
}

const DatePickerEnhanced: React.FC<DatePickerEnhancedProps> = ({ 
  onSelectDate, 
  selectedDate, 
  disabled,
  businessTimezone // Important for context, though react-datepicker itself uses local
}) => {
  
  // react-datepicker displays and handles dates in the user's local timezone.
  // When a date is selected, `onChange` provides a JS Date object.
  // This Date object represents a specific moment in time.
  // For API calls (like fetching availability for "YYYY-MM-DD"), we need to ensure
  // this "YYYY-MM-DD" refers to the calendar day in the business's timezone.

  const handleDateChange = (date: Date | null) => {
    if (date) {
      // `date` is now a JS Date object, midnight in user's local TZ for the selected day.
      // The parent component (`TenantPublicBookingPage`) will format this into 'YYYY-MM-DD'
      // string. The backend needs to interpret that string as a day in `businessTimezone`.
      onSelectDate(date);
    }
  };

  return (
    <div className="mb-6">
      <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700 mb-1">3. Select Date:</label>
      <DatePickerComponent
        id="booking-date"
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="MMMM d, yyyy"
        minDate={new Date()}
        disabled={disabled}
        placeholderText="Click to select a date"
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100"
        wrapperClassName="w-full"
      />
      {businessTimezone && <p className="text-xs text-gray-500 mt-1">Dates are shown in your local time. Business operates in {businessTimezone.replace('_', ' ')}.</p>}
    </div>
  );
};

export default DatePickerEnhanced;
