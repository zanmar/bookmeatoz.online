import { useTenant } from '@/contexts/TenantContext';
import { toZonedTime, format as formatWithTZ, getTimezoneOffset } from 'date-fns-tz';
import { format as formatDateFns } from 'date-fns';


export interface TimezoneUtils {
  businessTimezone: string | null;
  userLocalTimezone: string;
  toBusinessTime: (date: Date | string | number) => Date | null;
  toUserLocalTime: (date: Date | string | number) => Date;
  toUtcTimeFromBusiness: (localBusinessTime: Date) => Date | null;
  toUtcTimeFromUserLocal: (localUserTime: Date) => Date;
  formatInBusinessTimezone: (date: Date | string | number, formatString: string, options?: any) => string | null;
  formatInUserLocalTimezone: (date: Date | string | number, formatString: string, options?: any) => string;
  formatInUtc: (date: Date | string | number, formatString: string, options?: any) => string;
  getFormattedTimezoneOffset: (targetTimezone?: string) => string; // e.g., GMT-5, GMT+2
  combineDateAndTimeInBusinessTZToUTC: (dateInput: string | Date, timeInput: string) => Date | null; // HH:MM
}

// Use a custom validator for IANA timezones
const isValidIANATimezone = (tz: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const useTimezone = (): TimezoneUtils => {
  const { businessInfo } = useTenant();
  const businessTimezone = businessInfo?.timezone || null;
  const userLocalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const toBusinessTime = (date: Date | string | number): Date | null => {
    if (!businessTimezone || !isValidIANATimezone(businessTimezone)) return null;
    return toZonedTime(date, businessTimezone);
  };

  const toUserLocalTime = (date: Date | string | number): Date => {
    // date-fns-tz's utcToZonedTime converts from UTC to target. If date is already local, this might be off.
    // Assuming input 'date' is a UTC timestamp or Date object representing UTC.
    return toZonedTime(date, userLocalTimezone);
  };
  
  const toUtcTimeFromBusiness = (localBusinessTime: Date): Date | null => {
    if (!businessTimezone || !isValidIANATimezone(businessTimezone)) return null;
    // Custom implementation: Convert local business time to UTC
    const dateInBusinessTZ = toZonedTime(localBusinessTime, businessTimezone);
    return new Date(dateInBusinessTZ.getTime() - getTimezoneOffset(businessTimezone) * 60000);
  };

  const toUtcTimeFromUserLocal = (localUserTime: Date): Date => {
    // Custom implementation: Convert local user time to UTC
    const dateInUserLocalTZ = toZonedTime(localUserTime, userLocalTimezone);
    return new Date(dateInUserLocalTZ.getTime() - getTimezoneOffset(userLocalTimezone) * 60000);
  };

  const formatInTimeZoneShared = (
    dateInput: Date | string | number,
    formatString: string,
    timeZone: string | null,
    fallbackTimeZone: string, // User's local or UTC
    options?: any
  ): string | null => {
    const tzToUse = timeZone && isValidIANATimezone(timeZone) ? timeZone : null;
    if (!tzToUse) {
        console.warn(`Invalid or missing timezone, formatting in ${fallbackTimeZone}`);
        // Format in fallbackTimeZone (which should be valid)
        const dateObj = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
        try {
            // If dateInput is UTC, convert to fallbackTimeZone first for display
            const zonedDate = toZonedTime(dateObj, fallbackTimeZone);
            return formatWithTZ(zonedDate, formatString, { ...options, timeZone: fallbackTimeZone });
        } catch (e) {
            console.error("Error formatting date in fallback timezone:", e);
            return formatDateFns(dateObj, formatString); // Absolute fallback
        }
    }
    const dateToFormat = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    return formatWithTZ(dateToFormat, formatString, { ...options, timeZone: tzToUse });
  };


  const formatInBusinessTimezone = (
    date: Date | string | number,
    formatString: string,
    options?: any
  ): string | null => {
    return formatInTimeZoneShared(date, formatString, businessTimezone, userLocalTimezone, options);
  };

  const formatInUserLocalTimezone = (
    date: Date | string | number,
    formatString: string,
    options?: any
  ): string => {
    // User's local timezone is always assumed valid by Intl.DateTimeFormat()
    const dateToFormat = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return formatWithTZ(dateToFormat, formatString, { ...options, timeZone: userLocalTimezone });
  };
  
  const formatInUtc = (
    date: Date | string | number,
    formatString: string,
    options?: any
  ): string => {
    const dateToFormat = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return formatWithTZ(dateToFormat, formatString, { ...options, timeZone: 'UTC' });
  };

  const getFormattedTimezoneOffset = (targetTimezone?: string): string => {
    const tz = targetTimezone && isValidIANATimezone(targetTimezone) ? targetTimezone : userLocalTimezone;
    try {
      // Get offset in minutes, then convert to +/-HH:MM or use 'zzz' format token
      const offsetMinutes = getTimezoneOffset(tz); // For a specific date, or now
      const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
      const offsetMinsPart = Math.abs(offsetMinutes) % 60;
      const sign = offsetMinutes <= 0 ? '+' : '-'; // Note: getTimezoneOffset returns negative for UTC+X
      return `GMT${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinsPart).padStart(2, '0')}`;
    } catch (e) {
      return ''; // Fallback
    }
  };
  
  const combineDateAndTimeInBusinessTZToUTC = (dateInput: string | Date, timeInput: string): Date | null => {
    if (!businessTimezone || !isValidIANATimezone(businessTimezone)) return null;
    const datePart = typeof dateInput === 'string' ? dateInput : formatWithTZ(dateInput, 'yyyy-MM-dd', { timeZone: businessTimezone });
    const localDateTimeString = `${datePart}T${timeInput.length === 5 ? timeInput + ':00' : timeInput}`;
    // Custom implementation: Convert combined date and time in business TZ to UTC
    const dateInBusinessTZ = toZonedTime(localDateTimeString, businessTimezone);
    return new Date(dateInBusinessTZ.getTime() - getTimezoneOffset(businessTimezone) * 60000);
  };


  return {
    businessTimezone,
    userLocalTimezone,
    toBusinessTime,
    toUserLocalTime,
    toUtcTimeFromBusiness,
    toUtcTimeFromUserLocal,
    formatInBusinessTimezone,
    formatInUserLocalTimezone,
    formatInUtc,
    getFormattedTimezoneOffset,
    combineDateAndTimeInBusinessTZToUTC,
  };
};
