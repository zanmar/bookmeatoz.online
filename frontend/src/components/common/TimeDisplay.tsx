import React from 'react';
import { useTimezone } from '@/hooks/useTimezone'; // Assuming hook is in @/hooks
import { format as dateFnsFormat } from 'date-fns'; // Fallback formatter

interface TimeDisplayProps {
  utcTime: string | Date | number; // UTC timestamp (ISO string, Date object, or epoch ms)
  targetTimezone?: 'business' | 'local' | 'UTC' | string; // 'business', 'local', 'UTC', or specific IANA string
  format?: string; // date-fns format string
  showTimezoneAbbreviation?: boolean;
  className?: string;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
  utcTime,
  targetTimezone = 'local', // Default to user's local time
  format = 'MMM d, yyyy, h:mm a', // Default format
  showTimezoneAbbreviation = false,
  className,
}) => {
  const { 
    formatInBusinessTimezone, 
    formatInUserLocalTimezone, 
    formatInUtc, 
    businessTimezone, 
    userLocalTimezone 
  } = useTimezone();

  let formattedTime: string | null = null;
  let tzToUseForAbbr: string | undefined = undefined;

  try {
    if (targetTimezone === 'business') {
      formattedTime = formatInBusinessTimezone(utcTime, format);
      tzToUseForAbbr = businessTimezone || undefined;
    } else if (targetTimezone === 'local') {
      formattedTime = formatInUserLocalTimezone(utcTime, format);
      tzToUseForAbbr = userLocalTimezone;
    } else if (targetTimezone === 'UTC') {
      formattedTime = formatInUtc(utcTime, format);
      tzToUseForAbbr = 'UTC';
    } else { // Specific IANA string
      const dateToFormat = typeof utcTime === 'string' || typeof utcTime === 'number' ? new Date(utcTime) : utcTime;
      formattedTime = formatWithTZ(dateToFormat, format, { timeZone: targetTimezone });
      tzToUseForAbbr = targetTimezone;
    }
  } catch (e) {
    console.error("Error in TimeDisplay formatting:", e);
    // Fallback to simple local formatting if error
    try {
        formattedTime = dateFnsFormat(new Date(utcTime), format || 'Pp');
    } catch {
        formattedTime = "Invalid Date";
    }
  }
  

  // Get timezone abbreviation (e.g., EST, PST, GMT+2)
  // date-fns-tz format token 'zzz' or 'zzzz' can provide this.
  // For more control, you might need to use Intl.DateTimeFormat directly for the abbreviation part.
  let tzAbbr = '';
  if (showTimezoneAbbreviation && tzToUseForAbbr) {
    try {
        // 'zzz' gives short non-location specific (e.g. GMT-4)
        // 'zzzz' gives long non-location specific (e.g. Eastern Daylight Time)
        // For actual abbreviation like EST/PST, it's more complex and Intl.DateTimeFormat is better.
        // const dateObj = new Date(utcTime);
        // tzAbbr = formatWithTZ(dateObj, 'zzz', { timeZone: tzToUseForAbbr }); // Using zzz for offset
         const dtf = new Intl.DateTimeFormat(undefined, { timeZone: tzToUseForAbbr, timeZoneName: 'short' });
         tzAbbr = dtf.formatToParts(new Date(utcTime)).find(part => part.type === 'timeZoneName')?.value || '';

    } catch (e) {
        console.warn("Could not get timezone abbreviation for", tzToUseForAbbr);
    }
  }


  if (formattedTime === null) {
    // This case should ideally be handled if formatInBusinessTimezone returns null due to invalid business TZ
    return <span className={className || ''}>Time N/A (TZ Error)</span>;
  }

  return (
    <span className={className || ''}>
      {formattedTime}
      {showTimezoneAbbreviation && tzAbbr && <span className="ml-1 text-xs opacity-70">({tzAbbr})</span>}
    </span>
  );
};

export default TimeDisplay;
