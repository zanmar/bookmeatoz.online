import React from 'react';
import { TimeSlot } from '@/types';
import Spinner from '@/components/common/Spinner';
import { useTimezone } from '@/hooks/useTimezone'; // Import useTimezone

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
  const { formatInUserLocalTime, businessTimezone, userLocalTimezone } = useTimezone();

  if (disabled) return null;
  if (isLoadingSlots) { /* ... spinner ... */ }
  if (slots.length === 0) { /* ... no slots message ... */ }

  const formatTimeForDisplay = (utcIsoString: string) => {
    // Display in user's local time by default, but clearly indicate if it's business time.
    // The `useTimezone` hook provides `businessTimezone`.
    // For booking slots, it's often best to show them in the business's local time
    // to avoid confusion if the user is in a different timezone.
    // Or, show in user's local time and also indicate business time.
    
    // Option 1: Show in user's local time (current behavior)
    // return new Date(utcIsoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    // Option 2: Show in business's local time using the hook
    const formatted = formatInUserLocalTime(utcIsoString, 'p'); // 'p' is short time like 1:00 PM
    // const businessTimeFormatted = businessTimezone ? formatInBusinessTimezone(utcIsoString, 'p') : null;
    // if (businessTimeFormatted && businessTimeFormatted !== formatted) {
    //   return `${formatted} (Your time) / ${businessTimeFormatted} (Business time)`;
    // }
    return formatted || "Invalid Time";
  };


  return (
    <div className="mb-6">
      <p className="block text-sm font-medium text-gray-700 mb-3">
        4. Pick an Available Time <span className="text-xs text-gray-500">(shown in your local timezone: {userLocalTimezone.replace('_', ' ')})</span>
      </p>
      {/* Or: <p>Times shown in business timezone: {businessTimezone?.replace('_', ' ')}</p> */}
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
