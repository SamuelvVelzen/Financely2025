/**
 * Date Parsing Strategies
 * Factory pattern for parsing date formats from CSV data
 */

import type { BankEnum } from "../config/banks";
import type { ITimePrecision } from "@/features/shared/validation/schemas";

/**
 * Result of date parsing with precision information
 */
export interface IDateParseResult {
  isoString: string; // Full ISO datetime string
  precision: ITimePrecision; // DateTime or DateOnly
  dateOnly: string; // Calendar date in YYYY-MM-DD format
}

/**
 * Interface for date parsing strategies
 */
export interface IDateParsingStrategy {
  /**
   * Parse date value and return ISO format string with precision information
   */
  parseDate(value: string): IDateParseResult;
}

/**
 * Default strategy: Supports multiple common formats
 * Tries ISO format first, then common formats like YYYY-MM-DD, MM/DD/YYYY, DD.MM.YYYY
 */
export class DefaultDateParsing implements IDateParsingStrategy {
  parseDate(value: string): IDateParseResult {
    if (!value) {
      throw new Error("Date is required");
    }

    const trimmed = value.trim();

    // Check if value includes time component (ISO datetime or datetime-like)
    const hasTime = trimmed.includes("T") || / \d{1,2}:\d{2}/.test(trimmed);

    // Try ISO format first (may include time)
    const isoDate = new Date(trimmed);
    if (!isNaN(isoDate.getTime())) {
      const isoString = isoDate.toISOString();
      const dateOnly = isoString.split("T")[0];
      const precision: ITimePrecision = hasTime ? "DateTime" : "DateOnly";
      
      // If date-only, normalize to noon UTC as placeholder
      const normalizedIsoString = precision === "DateOnly" 
        ? `${dateOnly}T12:00:00.000Z`
        : isoString;

      return {
        isoString: normalizedIsoString,
        precision,
        dateOnly,
      };
    }

    // Try common date-only formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, DD.MM.YYYY
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD (date only)
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY (date only)
      /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY (date only)
    ];

    for (const format of formats) {
      const match = trimmed.match(format);
      if (match) {
        let year: string, month: string, day: string;

        if (format === formats[0]) {
          // YYYY-MM-DD
          [, year, month, day] = match;
        } else {
          // Assume DD/MM/YYYY or DD.MM.YYYY (most common in Europe)
          [, day, month, year] = match;
        }

        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          const dateOnly = `${year}-${month}-${day}`;
          // Use noon UTC as placeholder for date-only
          const isoString = `${dateOnly}T12:00:00.000Z`;
          
          return {
            isoString,
            precision: "DateOnly",
            dateOnly,
          };
        }
      }
    }

    throw new Error(`Invalid date format: ${value}`);
  }
}

/**
 * ING strategy: YYYYMMDD format
 * Parses dates like `20251210` (2025-12-10) → ISO format
 * ING format is always date-only (no time component)
 */
export class IngDateParsing implements IDateParsingStrategy {
  parseDate(value: string): IDateParseResult {
    if (!value) {
      throw new Error("Date is required");
    }

    // ING format: YYYYMMDD (8 digits) - always date-only
    const match = value.trim().match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!match) {
      throw new Error(
        `Invalid ING date format: ${value}. Expected YYYYMMDD format (e.g., 20251210)`
      );
    }

    const [, year, month, day] = match;
    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${value}`);
    }

    const dateOnly = `${year}-${month}-${day}`;
    // Use noon UTC as placeholder for date-only
    const isoString = `${dateOnly}T12:00:00.000Z`;

    return {
      isoString,
      precision: "DateOnly",
      dateOnly,
    };
  }
}

/**
 * Amex strategy: MM/DD/YYYY format
 * Parses dates like `06/30/2025` → ISO format
 * Amex format is typically date-only (no time component)
 */
export class AmexDateParsing implements IDateParsingStrategy {
  parseDate(value: string): IDateParseResult {
    if (!value) {
      throw new Error("Date is required");
    }

    // Amex format: MM/DD/YYYY - typically date-only
    const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      throw new Error(
        `Invalid Amex date format: ${value}. Expected MM/DD/YYYY format (e.g., 06/30/2025)`
      );
    }

    const [, month, day, year] = match;
    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${value}`);
    }

    const dateOnly = `${year}-${month}-${day}`;
    // Use noon UTC as placeholder for date-only
    const isoString = `${dateOnly}T12:00:00.000Z`;

    return {
      isoString,
      precision: "DateOnly",
      dateOnly,
    };
  }
}

/**
 * Date parsing strategy factory
 */
export class DateParsingFactory {
  private static strategies: Map<string, IDateParsingStrategy> = new Map([
    ["default", new DefaultDateParsing()],
    ["amex", new AmexDateParsing()],
    ["ing", new IngDateParsing()],
  ]);

  /**
   * Get a date parsing strategy for a bank
   * Maps bank enum to appropriate strategy
   */
  static getStrategy(bank?: BankEnum | null): IDateParsingStrategy {
    let strategyName: string;
    if (bank === "AMERICAN_EXPRESS") {
      strategyName = "amex";
    } else if (bank === "ING") {
      strategyName = "ing";
    } else {
      strategyName = "default";
    }

    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      // Fallback to default if strategy not found
      return this.strategies.get("default")!;
    }
    return strategy;
  }

  /**
   * Get all available strategies
   */
  static getAllStrategies(): Array<{ name: string; strategy: IDateParsingStrategy }> {
    return Array.from(this.strategies.entries()).map(([name, strategy]) => ({
      name,
      strategy,
    }));
  }

  /**
   * Register a new strategy
   */
  static registerStrategy(name: string, strategy: IDateParsingStrategy): void {
    this.strategies.set(name, strategy);
  }
}

