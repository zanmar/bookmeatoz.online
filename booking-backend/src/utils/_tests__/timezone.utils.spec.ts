import {
  toBusinessTime,
  toUtcTime,
  formatInTimeZone,
  isValidTimezone,
  combineDateAndTimeInTimezoneToUTC,
} from '../timezone.utils'; // Adjust path if needed
import { setDefaultOptions as setDefaultDateFnsOptions, Options } from 'date-fns-tz';

// It's good practice to set a default timezone for tests if date-fns behavior might vary by system TZ
// However, date-fns-tz functions usually require explicit timezone arguments.
// For consistency, ensure your functions always use explicit timezones.

describe('Timezone Utilities', () => {
  const newYorkTz = 'America/New_York';
  const londonTz = 'Europe/London';
  const invalidTz = 'Mars/Olympus_Mons';
  const utcDateString = '2024-07-15T12:00:00.000Z'; // Noon UTC on July 15, 2024
  const utcDate = new Date(utcDateString);

  describe('isValidTimezone', () => {
    it('should return true for valid IANA timezones', () => {
      expect(isValidTimezone(newYorkTz)).toBe(true);
      expect(isValidTimezone(londonTz)).toBe(true);
      expect(isValidTimezone('UTC')).toBe(true);
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
    });

    it('should return false for invalid timezone strings', () => {
      expect(isValidTimezone(invalidTz)).toBe(false);
      expect(isValidTimezone('GMT+5')).toBe(false); // Not IANA, use Etc/GMT-5
      expect(isValidTimezone('')).toBe(false);
    });
  });

  describe('toBusinessTime', () => {
    it('should convert UTC Date to business timezone Date', () => {
      // Noon UTC is 8 AM in New York (EDT during July)
      const nyTime = toBusinessTime(utcDate, newYorkTz);
      expect(nyTime).toBeInstanceOf(Date);
      // Check string representation in that timezone
      // Note: nyTime.getHours() would give local system hours, not NY hours unless system is NY.
      // So we format it to check.
      const formattedNy = formatInTimeZone(nyTime, 'yyyy-MM-dd HH:mm:ss', newYorkTz);
      expect(formattedNy).toBe('2024-07-15 08:00:00');
    });

    it('should convert UTC ISO string to business timezone Date', () => {
      const londonTime = toBusinessTime(utcDateString, londonTz);
      // Noon UTC is 1 PM in London (BST during July)
      const formattedLondon = formatInTimeZone(londonTime, 'yyyy-MM-dd HH:mm:ss', londonTz);
      expect(formattedLondon).toBe('2024-07-15 13:00:00');
    });

    it('should throw error for invalid business timezone', () => {
      expect(() => toBusinessTime(utcDate, invalidTz)).toThrow(
        `Invalid IANA timezone string provided: ${invalidTz}`
      );
    });
  });

  describe('toUtcTime', () => {
    it('should convert local business time Date to UTC Date', () => {
      // Assume 8 AM in New York on July 15
      const localNyDate = new Date(2024, 6, 15, 8, 0, 0); // Month is 0-indexed (6 = July)
      const utcEquivalent = toUtcTime(localNyDate, newYorkTz);
      expect(utcEquivalent.toISOString()).toBe(utcDateString); // Should be noon UTC
    });

    it('should throw error for invalid business timezone', () => {
      const localDate = new Date();
      expect(() => toUtcTime(localDate, invalidTz)).toThrow(
        `Invalid IANA timezone string provided: ${invalidTz}`
      );
    });
  });

  describe('formatInTimeZone', () => {
    it('should format date correctly in specified timezone', () => {
      const formatted = formatInTimeZone(utcDate, 'Pp zzz', newYorkTz); // Pp = short date, short time
      expect(formatted).toMatch(/Jul 15, 2024, 8:00:00 AM GMT-[45]:00/); // EDT is GMT-4, EST is GMT-5
    });

    it('should fallback to system time formatting if timezone is invalid and log warning', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // This will format using the test runner's system timezone
      const formatted = formatInTimeZone(utcDate, 'yyyy-MM-dd HH:mm:ss', invalidTz);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining(invalidTz));
      // The actual output depends on the test runner's TZ, so we just check it doesn't throw
      expect(formatted).toBeDefined();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('combineDateAndTimeInTimezoneToUTC', () => {
    it('should combine YYYY-MM-DD and HH:MM in business TZ to correct UTC Date', () => {
      const dateStr = '2024-07-15';
      const timeStr = '08:00'; // 8 AM in New York
      const utcResult = combineDateAndTimeInTimezoneToUTC(dateStr, timeStr, newYorkTz);
      expect(utcResult).toBeInstanceOf(Date);
      expect(utcResult.toISOString()).toBe(utcDateString); // Should be noon UTC
    });

    it('should handle Date object as dateInput', () => {
      const dateObj = new Date(2024, 6, 15); // July 15, local time of test runner
      const timeStr = '13:00'; // 1 PM in London
      const utcResult = combineDateAndTimeInTimezoneToUTC(dateObj, timeStr, londonTz);
      // If dateObj is midnight local, and local is not London, this will be different.
      // For consistency, it's better if dateInput for this function is also interpreted as being in businessTimezone.
      // The current implementation of combineDateAndTimeInTimezoneToUTC uses formatWithTZ(dateInput, 'yyyy-MM-dd', { timeZone: businessTimezone });
      // This means it takes the date part of dateObj AS IF IT WERE IN businessTimezone.
      // So, if dateObj is July 15 local, it takes "July 15" and combines with 13:00 London time.
      expect(utcResult.toISOString()).toBe(utcDateString); // Should be noon UTC
    });

    it('should throw for invalid timezone', () => {
      expect(() => combineDateAndTimeInTimezoneToUTC('2024-01-01', '10:00', invalidTz)).toThrow(
        `Invalid IANA timezone string provided: ${invalidTz}`
      );
    });
  });
});
