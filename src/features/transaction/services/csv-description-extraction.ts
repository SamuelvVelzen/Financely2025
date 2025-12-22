/**
 * Description Extraction Strategies
 * Factory pattern for extracting and enhancing transaction descriptions from CSV data
 */

import type { ICsvFieldMapping } from "@/features/shared/validation/schemas";
import type { BankEnum } from "../config/banks";

export interface IDescriptionExtractionContext {
  row: Record<string, string>; // Full CSV row data
  mapping: ICsvFieldMapping; // Field mapping to access mapped columns
  bank?: BankEnum | null;
}

export interface IExtractedDescription {
  name: string; // Enhanced/combined name
  description: string | null; // Extracted description
  dateTime: string | null; // Extracted date/time in ISO format (preferred)
  valueDate: string | null; // Extracted value date in ISO format (fallback)
}

/**
 * Interface for description extraction strategies
 */
export interface IDescriptionExtractionStrategy {
  /**
   * Extract and enhance description from context
   */
  extractDescription(
    context: IDescriptionExtractionContext
  ): IExtractedDescription;

  /**
   * Human-readable name for the strategy
   */
  getName(): string;

  /**
   * Description of how the strategy works
   */
  getDescription(): string;

  /**
   * Check if this strategy supports date/time extraction
   */
  supportsDateTimeExtraction(): boolean;
}

/**
 * Default strategy: Simple pass-through
 * Just uses the mapped fields as-is
 */
export class DefaultDescriptionExtraction
  implements IDescriptionExtractionStrategy
{
  extractDescription(
    context: IDescriptionExtractionContext
  ): IExtractedDescription {
    const nameColumn = context.mapping.name;
    const descriptionColumn = context.mapping.description;

    return {
      name: nameColumn ? context.row[nameColumn]?.trim() || "" : "",
      description: descriptionColumn
        ? context.row[descriptionColumn]?.trim() || null
        : null,
      dateTime: null,
      valueDate: null,
    };
  }

  getName(): string {
    return "Default";
  }

  getDescription(): string {
    return "Uses name and description fields as-is";
  }

  supportsDateTimeExtraction(): boolean {
    return false;
  }
}

/**
 * ING strategy: Extract useful metadata from Notifications field
 * Parses the Notifications field to extract descriptions, dates, and other metadata
 */
export class IngDescriptionExtraction
  implements IDescriptionExtractionStrategy
{
  extractDescription(
    context: IDescriptionExtractionContext
  ): IExtractedDescription {
    const nameColumn = context.mapping.name;
    const descriptionColumn = context.mapping.description;

    const name = nameColumn ? context.row[nameColumn]?.trim() || "" : "";
    const notifications = descriptionColumn
      ? context.row[descriptionColumn]?.trim() || ""
      : "";

    // Extract description from notifications if it exists
    const extractedDescription =
      this.extractDescriptionFromNotifications(notifications);

    // Extract date/time from notifications if it exists
    const { dateTime, valueDate } =
      this.extractDateTimeFromNotifications(notifications);

    // If name is generic (like "Hr SIH van Velzen") and we found a description,
    // combine them intelligently
    const enhancedName = this.enhanceName(name, extractedDescription);

    return {
      name: enhancedName,
      description: extractedDescription || null,
      dateTime,
      valueDate,
    };
  }

  /**
   * Extract description from ING Notifications field
   * Looks for patterns like:
   * - "Description: ..."
   * - "Name: ... Description: ..."
   * - Card transactions with useful info
   */
  private extractDescriptionFromNotifications(
    notifications: string
  ): string | null {
    if (!notifications) return null;

    // Pattern 1: Extract from SEPA/structured format - stop at IBAN or other delimiters
    // This comes FIRST to catch structured formats before generic Description: pattern
    // Example: "Name: Mw BLA Houweling Description: Mywheels 2024-2025 IBAN: ..."
    // Match description until we see space + delimiter (IBAN:, Date/time:, Value date:)
    const sepaMatch = notifications.match(
      /Description:\s*((?:(?!\s+(?:IBAN:|Date\/time:|Value date:))[^\n])+?)(?:\s+(?:IBAN:|Date\/time:|Value date:)|$)/i
    );
    if (sepaMatch && sepaMatch[1]) {
      return sepaMatch[1].trim();
    }

    // Pattern 2: Look for "Name: ... Description: ..." pattern (structured)
    // Stop at common delimiters like IBAN, Date/time, Value date
    const nameDescMatch = notifications.match(
      /Name:\s*[^\n]+\s+Description:\s*((?:(?!\s+(?:IBAN:|Date\/time:|Value date:))[^\n])+?)(?:\s+(?:IBAN:|Date\/time:|Value date:)|$)/i
    );
    if (nameDescMatch && nameDescMatch[1]) {
      return nameDescMatch[1].trim();
    }

    // Pattern 3: Generic "Description:" field (fallback)
    // Try to clean it up - stop at common delimiters
    const descriptionMatch = notifications.match(/Description:\s*([^\n]+)/i);
    if (descriptionMatch && descriptionMatch[1]) {
      const desc = descriptionMatch[1].trim();
      // Stop at IBAN, Date/time, or Value date if present
      const cleaned = desc.split(/\s+(?:IBAN:|Date\/time:|Value date:)/i)[0];
      return cleaned.trim();
    }

    // Pattern 4: Extract useful info from card transactions
    // Example: "Card sequence no.: 901 19/12/2025 18:14 Transaction: P00247 Term: BS178250 Apple Pay"
    const cardMatch = notifications.match(
      /(?:Card sequence no\.:|Transaction:|Term:)\s*([^\n]+)/i
    );
    if (cardMatch) {
      // Extract the most relevant part (usually the merchant/service name)
      const relevantParts: string[] = [];

      // Look for recognizable patterns
      if (notifications.includes("Apple Pay")) {
        relevantParts.push("Apple Pay");
      }
      if (notifications.includes("Transaction:")) {
        const txMatch = notifications.match(/Transaction:\s*([A-Z0-9]+)/i);
        if (txMatch) relevantParts.push(`TX: ${txMatch[1]}`);
      }

      return relevantParts.length > 0 ? relevantParts.join(" - ") : null;
    }

    // Pattern 5: Extract transfer descriptions
    // Example: "To Oranje spaarrekening X95055042 Afronding"
    if (notifications.includes("To ") && notifications.includes("Afronding")) {
      return "Savings transfer";
    }

    return null;
  }

  /**
   * Extract date/time from ING Notifications field
   * Looks for patterns like:
   * - "Date/time: DD-MM-YYYY HH:MM:SS"
   * - "Value date: DD/MM/YYYY"
   */
  private extractDateTimeFromNotifications(notifications: string): {
    dateTime: string | null;
    valueDate: string | null;
  } {
    if (!notifications) {
      return { dateTime: null, valueDate: null };
    }

    let dateTime: string | null = null;
    let valueDate: string | null = null;

    // Pattern 1: Extract "Date/time: DD-MM-YYYY HH:MM:SS"
    const dateTimeMatch = notifications.match(
      /Date\/time:\s*(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})/i
    );
    if (dateTimeMatch && dateTimeMatch[1]) {
      dateTime = this.parseNotificationDateTime(dateTimeMatch[1].trim());
    }

    // Pattern 2: Extract "Value date: DD/MM/YYYY"
    const valueDateMatch = notifications.match(
      /Value date:\s*(\d{2}\/\d{2}\/\d{4})/i
    );
    if (valueDateMatch && valueDateMatch[1]) {
      valueDate = this.parseNotificationDateTime(valueDateMatch[1].trim());
    }

    return { dateTime, valueDate };
  }

  /**
   * Parse date/time formats found in ING notifications
   * Supports:
   * - "DD-MM-YYYY HH:MM:SS" (Date/time format)
   * - "DD/MM/YYYY" (Value date format)
   */
  private parseNotificationDateTime(dateTimeStr: string): string | null {
    if (!dateTimeStr) return null;

    // Try Date/time format: DD-MM-YYYY HH:MM:SS
    const dateTimeMatch = dateTimeStr.match(
      /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
    );
    if (dateTimeMatch) {
      const [, day, month, year, hour, minute, second] = dateTimeMatch;
      const date = new Date(
        `${year}-${month}-${day}T${hour}:${minute}:${second}`
      );
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // Try Value date format: DD/MM/YYYY
    const valueDateMatch = dateTimeStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (valueDateMatch) {
      const [, day, month, year] = valueDateMatch;
      const date = new Date(`${year}-${month}-${day}T00:00:00`);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    return null;
  }

  /**
   * Enhance the name field by combining with extracted description
   * If name is generic (like a person's name), use description if available
   */
  private enhanceName(name: string, description: string | null): string {
    if (!description) return name;

    // Check if name looks like a person's name (common Dutch patterns)
    const isPersonName =
      /^(Hr|Mw|Mr|Mrs|Ms|Dr)\.?\s+[A-Z]/.test(name) ||
      /^[A-Z][a-z]+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(name);

    // If it's a person name and we have a description, combine them
    if (isPersonName && description) {
      // Extract a short description (first part before comma or long text)
      const shortDesc = description.split(/[,;]/)[0].trim();
      if (shortDesc.length < 50) {
        return `${name} | ${shortDesc}`;
      }
    }

    return name;
  }

  getName(): string {
    return "ING Format";
  }

  getDescription(): string {
    return "Extracts descriptions from Notifications field and enhances names";
  }

  supportsDateTimeExtraction(): boolean {
    return true;
  }
}

/**
 * Description extraction strategy factory
 */
export class DescriptionExtractionFactory {
  private static strategies: Map<string, IDescriptionExtractionStrategy> =
    new Map([
      ["default", new DefaultDescriptionExtraction()],
      ["ing", new IngDescriptionExtraction()],
    ]);

  /**
   * Get a description extraction strategy by name
   */
  static getStrategy(name: string): IDescriptionExtractionStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      return this.strategies.get("default")!;
    }
    return strategy;
  }

  /**
   * Get all available strategies
   */
  static getAllStrategies(): Array<{
    name: string;
    strategy: IDescriptionExtractionStrategy;
  }> {
    return Array.from(this.strategies.entries()).map(([name, strategy]) => ({
      name,
      strategy,
    }));
  }

  /**
   * Register a new strategy
   */
  static registerStrategy(
    name: string,
    strategy: IDescriptionExtractionStrategy
  ): void {
    this.strategies.set(name, strategy);
  }
}

/**
 * Default strategy name
 */
export const DEFAULT_DESCRIPTION_EXTRACTION_STRATEGY = "default";

/**
 * Get default description extraction strategy for a bank
 */
export function getDefaultDescriptionExtractionForBank(
  bank?: BankEnum | null
): string {
  if (bank === "ING") {
    return "ing";
  }
  return "default";
}

/**
 * Check if a bank's description extraction strategy supports date/time extraction
 */
export function supportsDateTimeExtraction(bank?: BankEnum | null): boolean {
  const strategyName = getDefaultDescriptionExtractionForBank(bank);
  const strategy = DescriptionExtractionFactory.getStrategy(strategyName);
  return strategy.supportsDateTimeExtraction();
}

/**
 * Check if a bank has custom description extraction (not default)
 */
export function hasDescriptionExtraction(bank?: BankEnum | null): boolean {
  const strategyName = getDefaultDescriptionExtractionForBank(bank);
  return strategyName !== "default";
}
