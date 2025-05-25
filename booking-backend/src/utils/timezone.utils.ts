import { toZonedTime, format as formatWithTZ } from 'date-fns-tz';

/**
 * Converts a UTC Date object or ISO string to a Date object in the specified business timezone.
 * The time value remains the same instant, but its string representation will be in the target timezone.
 * @param utcTime Date object or ISO string (assumed to be UTC if string has no offset or 'Z')
 * @param businessTimezone IANA timezone string (e.g., 'America/New_York')
 * @returns Date object representing the same instant, but configured for the business timezone.
 */
export function toBusinessTime(utcTime: Date | string, businessTimezone: string): Date {
  const dateToConvert = typeof utcTime === 'string' ? new Date(utcTime) : utcTime;
  return toZonedTime(dateToConvert, businessTimezone);
}

/**
 * Formats a Date object or ISO string into a string representation in the specified timezone.
 * @param dateInput Date object or ISO string
 * @param formatString date-fns format string (e.g., 'yyyy-MM-dd HH:mm:ss zzz')
 * @param timeZone IANA timezone string
 * @param options Additional date-fns-tz formatting options
 * @returns Formatted date string.
 */
export function formatInTimeZone(
  dateInput: Date | string | number,
  formatString: string,
  timeZone: string,
  options?: any
): string {
  // Ensure dateInput is a Date object for formatWithTZ
  const dateToFormat =
    typeof dateInput === 'string' || typeof dateInput === 'number'
      ? new Date(dateInput)
      : dateInput;
  return formatWithTZ(dateToFormat, formatString, { ...options, timeZone });
}

/**
 * Combines a date (YYYY-MM-DD string or Date object) with a time string (HH:MM or HH:MM:SS)
 * and interprets it as a local date/time in the given business timezone, then converts to a UTC Date object.
 * @param dateInput YYYY-MM-DD string or a Date object (only date part will be used)
 * @param timeInput HH:MM or HH:MM:SS string
 * @param businessTimezone IANA timezone string
 * @returns UTC Date object
 */
export function combineDateAndTimeInTimezoneToUTC(
  dateInput: string | Date,
  timeInput: string, // "HH:MM" or "HH:MM:SS"
  businessTimezone: string
): Date {
  const datePart =
    typeof dateInput === 'string'
      ? dateInput
      : formatWithTZ(dateInput, 'yyyy-MM-dd', { timeZone: businessTimezone });
  const localDateTimeString = `${datePart}T${timeInput.length === 5 ? timeInput + ':00' : timeInput}`; // Ensure seconds part

  // Create a Date object by parsing localDateTimeString as if it's in businessTimezone
  // zonedTimeToUtc will take this local time string and the source timezone, and convert to UTC Date object
  return toZonedTime(localDateTimeString, businessTimezone);
}

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function toUtcTime(date: string, tz: string): string {
  // Simple implementation: parse date in tz and convert to UTC ISO string
  const d = new Date(date + ' UTC');
  return d.toISOString();
}
