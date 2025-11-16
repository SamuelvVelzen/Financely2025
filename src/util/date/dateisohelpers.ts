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

