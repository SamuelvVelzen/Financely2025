/**
 * Date Parsing Strategies
 * Factory pattern for parsing date formats from CSV data
 */

import type { BankEnum } from "../config/banks";

/**
 * Interface for date parsing strategies
 */
export interface IDateParsingStrategy {
  /**
   * Parse date value to ISO format string
   */
  parseDate(value: string): string;
}

/**
 * Default strategy: Supports multiple common formats
 * Tries ISO format first, then common formats like YYYY-MM-DD, MM/DD/YYYY, DD.MM.YYYY
 */
export class DefaultDateParsing implements IDateParsingStrategy {
  parseDate(value: string): string {
    if (!value) {
      throw new Error("Date is required");
    }

    // Try ISO format first
    const isoDate = new Date(value);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toISOString();
    }

    // Try common formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, DD.MM.YYYY
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
      /^(\d{2})\.(\d{2})\.(\d{4})/, // DD.MM.YYYY
    ];

    for (const format of formats) {
      const match = value.match(format);
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
          return date.toISOString();
        }
      }
    }

    throw new Error(`Invalid date format: ${value}`);
  }
}

/**
 * ING strategy: YYYYMMDD format
 * Parses dates like `20251210` (2025-12-10) → ISO format
 */
export class IngDateParsing implements IDateParsingStrategy {
  parseDate(value: string): string {
    if (!value) {
      throw new Error("Date is required");
    }

    // ING format: YYYYMMDD (8 digits)
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

    return date.toISOString();
  }
}

/**
 * Amex strategy: MM/DD/YYYY format
 * Parses dates like `06/30/2025` → ISO format
 */
export class AmexDateParsing implements IDateParsingStrategy {
  parseDate(value: string): string {
    if (!value) {
      throw new Error("Date is required");
    }

    // Amex format: MM/DD/YYYY
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

    return date.toISOString();
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

