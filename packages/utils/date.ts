/**
 * Date formatting utilities for OpenFlow
 *
 * Provides consistent date formatting across the application
 * without external dependencies.
 */

/**
 * Format options for date display
 */
export interface FormatDateOptions {
  includeTime?: boolean;
  includeSeconds?: boolean;
  use24Hour?: boolean;
}

/**
 * Formats a date string or Date object into a human-readable format.
 *
 * @param date - ISO date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15T10:30:00Z') // => 'Jan 15, 2024'
 * formatDate('2024-01-15T10:30:00Z', { includeTime: true }) // => 'Jan 15, 2024 10:30 AM'
 */
export function formatDate(date: string | Date, options: FormatDateOptions = {}): string {
  const { includeTime = false, includeSeconds = false, use24Hour = false } = options;

  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    dateOptions.hour = 'numeric';
    dateOptions.minute = '2-digit';
    dateOptions.hour12 = !use24Hour;

    if (includeSeconds) {
      dateOptions.second = '2-digit';
    }
  }

  return d.toLocaleDateString('en-US', dateOptions);
}

/**
 * Time unit thresholds in milliseconds
 */
const TIME_UNITS = {
  year: 365 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
} as const;

/**
 * Formats a date as a relative time string (e.g., "5 minutes ago").
 *
 * @param date - ISO date string or Date object
 * @param baseDate - Base date for comparison (defaults to now)
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000)) // => '5 minutes ago'
 * formatRelativeTime(new Date(Date.now() + 60 * 60 * 1000)) // => 'in 1 hour'
 */
export function formatRelativeTime(date: string | Date, baseDate: Date = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const diff = d.getTime() - baseDate.getTime();
  const absDiff = Math.abs(diff);
  const isFuture = diff > 0;

  // Less than a minute
  if (absDiff < TIME_UNITS.minute) {
    return 'just now';
  }

  // Find the appropriate unit
  for (const [unit, ms] of Object.entries(TIME_UNITS)) {
    if (absDiff >= ms) {
      const value = Math.floor(absDiff / ms);
      const unitName = value === 1 ? unit : `${unit}s`;

      return isFuture ? `in ${value} ${unitName}` : `${value} ${unitName} ago`;
    }
  }

  return 'just now';
}

/**
 * Parses a date string into a Date object.
 * Handles various date formats gracefully.
 *
 * @param dateString - Date string to parse
 * @returns Date object or null if invalid
 *
 * @example
 * parseDate('2024-01-15T10:30:00Z') // => Date object
 * parseDate('invalid') // => null
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const d = new Date(dateString);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d;
}

/**
 * Checks if a date is today.
 *
 * @param date - ISO date string or Date object
 * @returns True if the date is today
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Formats a date for display in compact form (used in lists).
 * Shows time if today, otherwise shows date.
 *
 * @param date - ISO date string or Date object
 * @returns Compact date string
 *
 * @example
 * formatCompact(new Date()) // => '10:30 AM' (if today)
 * formatCompact('2024-01-10') // => 'Jan 10' (if this year)
 * formatCompact('2023-01-10') // => 'Jan 10, 2023' (if different year)
 */
export function formatCompact(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    return 'Invalid date';
  }

  if (isToday(d)) {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  const now = new Date();
  const isSameYear = d.getFullYear() === now.getFullYear();

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(isSameYear ? {} : { year: 'numeric' }),
  });
}
