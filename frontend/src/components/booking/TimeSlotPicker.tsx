import React from 'react';
import { TimeSlot } from '@/types';
import Spinner from '@/components/common/Spinner';
import { useTimezone } from '@/hooks/useTimezone';
// import { formatInTimeZone } from 'date-fns-tz'; // Not needed if useTimezone exposes it

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  onSelectSlot: (slot: TimeSlot) => void;
  isLoadingSlots: boolean;
  selectedSlotStartTime?: string;
  disabled?: boolean;
  // businessTimezone prop is no longer strictly needed here if useTimezone hook is used internally
  // or if parent formats the time string for display.
  // However, for clarity, parent can pass it or this component can use the hook.
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  onSelectSlot,
  isLoadingSlots,
  selectedSlotStartTime,
  disabled,
}) => {
  const { businessTimezone, formatInBusinessTimezone } = useTimezone(); // Using formatInBusinessTimezone from hook

  if (disabled) {
    return (
        <div className="mb-6">
          <p className="block text-sm font-medium text-gray-400 mb-3">4. Pick an Available Time</p>
          <div className="text-center text-gray-500 p-4 border border-dashed rounded-lg">
            Please select a date first.
          </div>
        </div>
    );
  }

  if (isLoadingSlots) {
    return (
      <div className="mb-6">
        <p className="block text-sm font-medium text-gray-700 mb-3">4. Pick an Available Time</p>
        <div className="flex justify-center items-center p-4 border border-dashed rounded-lg">
          <Spinner size="md" /> 
          <span className="ml-2 text-gray-500">Finding available slots...</span>
        </div>
      </div>
    );
  }
  
  if (slots.length === 0) {
    return (
      <div className="mb-6">
        <p className="block text-sm font-medium text-gray-700 mb-3">4. Pick an Available Time</p>
        <div className="text-center text-gray-500 p-4 border border-dashed rounded-lg">
          No time slots available for the selected date or criteria. Please try another date.
        </div>
      </div>
    );
  }

  const formatTimeForDisplay = (utcIsoString: string) => {
    if (!businessTimezone) {
      // Fallback if businessTimezone is somehow not available, though useTimezone should provide it
      return new Date(utcIsoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    // Use formatInBusinessTimezone from the hook
    return formatInBusinessTimezone(utcIsoString, 'p') || "Invalid Time"; // 'p' is for h:mm a
  };


  return (
    <div className="mb-6">
      <p className="block text-sm font-medium text-gray-700 mb-3">
        4. Pick an Available Time <span className="text-xs text-gray-500">(shown in business timezone: {businessTimezone ? businessTimezone.replace('_', ' ') : 'Loading...'})</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {slots.map(slot => (
          <button
            key={`${slot.start_time}-${slot.employee_id || 'any'}`}
            onClick={() => onSelectSlot(slot)}
            disabled={!slot.is_available}
            className={`p-3 border rounded-lg text-sm font-semibold text-center transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1
                        ${slot.start_time === selectedSlotStartTime 
                            ? 'bg-primary text-white ring-primary-dark shadow-lg transform scale-105' 
                            : 'bg-primary-lightest text-primary-dark hover:bg-primary-light hover:shadow-md focus:ring-primary-light'}
                        ${!slot.is_available ? 'opacity-60 cursor-not-allowed bg-gray-200 text-gray-500 hover:bg-gray-200' : 'cursor-pointer'}`}
          >
            {formatTimeForDisplay(slot.start_time)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotPicker;
