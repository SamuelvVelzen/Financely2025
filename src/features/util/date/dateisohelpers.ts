/**
 * Date ISO Helpers
 * Utility functions for converting between ISO datetime strings and datetime-local format
 */

/**
 * Convert ISO datetime string to datetime-local format
 * @param isoString - ISO datetime string (e.g., "2024-01-15T14:30:00.000Z")
 * @returns datetime-local format string (e.g., "2024-01-15T14:30")
 */
export function isoToDatetimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local format to ISO datetime string
 * @param datetimeLocal - datetime-local format string (e.g., "2024-01-15T14:30")
 * @returns ISO datetime string (e.g., "2024-01-15T14:30:00.000Z")
 */
export function datetimeLocalToIso(datetimeLocal: string): string {
  return new Date(datetimeLocal).toISOString();
}

/**
 * Convert ISO datetime string to date-only format (YYYY-MM-DD)
 * @param isoString - ISO datetime string (e.g., "2024-01-15T14:30:00.000Z")
 * @returns Date-only format string (e.g., "2024-01-15")
 */
export function isoToDateOnly(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert date-only format to datetime-local format with default time
 * @param dateOnly - Date-only format string (e.g., "2024-01-15")
 * @param defaultTime - Default time in HH:mm format (default: "12:00")
 * @returns Datetime-local format string (e.g., "2024-01-15T12:00")
 */
export function dateOnlyToDatetimeLocal(
  dateOnly: string,
  defaultTime: string = "12:00"
): string {
  return `${dateOnly}T${defaultTime}`;
}

/**
 * Convert date-only format to ISO datetime string with noon UTC placeholder
 * @param dateOnly - Date-only format string (e.g., "2024-01-15")
 * @returns ISO datetime string (e.g., "2024-01-15T12:00:00.000Z")
 */
export function dateOnlyToIso(dateOnly: string): string {
  return new Date(`${dateOnly}T12:00:00.000Z`).toISOString();
}

