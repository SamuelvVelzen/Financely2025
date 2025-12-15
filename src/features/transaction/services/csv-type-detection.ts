/**
 * Transaction Type Detection Strategies
 * Factory pattern for determining transaction type from CSV data
 */

import type { ICsvFieldMapping } from "@/features/shared/validation/schemas";
import type { BankEnum } from "../config/banks";

export type ITransactionType = "EXPENSE" | "INCOME";

export interface ITypeDetectionContext {
  amount: string; // Parsed amount as string
  rawAmount: string; // Original raw amount value from CSV
  row: Record<string, string>; // Full CSV row data
  mapping?: ICsvFieldMapping; // Field mapping to access mapped columns
}

/**
 * Interface for type detection strategies
 */
export interface ITypeDetectionStrategy {
  /**
   * Detect transaction type from context
   */
  detectType(context: ITypeDetectionContext): ITransactionType;

  /**
   * Human-readable name for the strategy
   */
  getName(): string;

  /**
   * Description of how the strategy works
   */
  getDescription(): string;
}

/**
 * Default strategy: Sign-based detection
 * Negative amount = EXPENSE, Positive amount = INCOME
 */
export class SignBasedTypeDetection implements ITypeDetectionStrategy {
  detectType(context: ITypeDetectionContext): ITransactionType {
    const amount = parseFloat(context.amount);
    return amount < 0 ? "EXPENSE" : "INCOME";
  }

  getName(): string {
    return "Sign-based (Default)";
  }

  getDescription(): string {
    return "Negative amounts are expenses, positive amounts are income";
  }
}

/**
 * Amex strategy: Inverted sign-based detection
 * Negative amount = INCOME, Positive amount = EXPENSE
 */
export class AmexTypeDetection implements ITypeDetectionStrategy {
  detectType(context: ITypeDetectionContext): ITransactionType {
    const amount = parseFloat(context.amount);
    // Amex: negative = income (credits), positive = expense (charges)
    return amount < 0 ? "INCOME" : "EXPENSE";
  }

  getName(): string {
    return "Amex Format";
  }

  getDescription(): string {
    return "Negative amounts are income (credits), positive amounts are expenses (charges)";
  }
}

/**
 * ING strategy: Column-based detection
 * Uses a mapped "type" column containing "debit" or "credit"
 * "debit" = EXPENSE, "credit" = INCOME
 */
export class IngTypeDetection implements ITypeDetectionStrategy {
  detectType(context: ITypeDetectionContext): ITransactionType {
    if (!context.mapping?.type) {
      throw new Error(
        "ING strategy requires 'type' field to be mapped to debit/credit column"
      );
    }

    const typeColumn = context.mapping.type;
    const typeValue = context.row[typeColumn]?.trim().toLowerCase() || "";

    if (typeValue === "debit" || typeValue === "af") {
      return "EXPENSE";
    } else if (typeValue === "credit" || typeValue === "bij") {
      return "INCOME";
    } else {
      throw new Error(
        `Invalid type value "${context.row[typeColumn]}". Expected "debit"/"af" or "credit"/"bij"`
      );
    }
  }

  getName(): string {
    return "ING Format";
  }

  getDescription(): string {
    return "Uses debit/credit column: debit = expense, credit = income";
  }
}

/**
 * Type detection strategy factory
 */
export class TypeDetectionFactory {
  private static strategies: Map<string, ITypeDetectionStrategy> = new Map([
    ["sign-based", new SignBasedTypeDetection()],
    ["amex", new AmexTypeDetection()],
    ["ing", new IngTypeDetection()],
  ]);

  /**
   * Get a type detection strategy by name
   */
  static getStrategy(name: string): ITypeDetectionStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      // Default to sign-based if strategy not found
      return this.strategies.get("sign-based")!;
    }
    return strategy;
  }

  /**
   * Get all available strategies
   */
  static getAllStrategies(): Array<{ name: string; strategy: ITypeDetectionStrategy }> {
    return Array.from(this.strategies.entries()).map(([name, strategy]) => ({
      name,
      strategy,
    }));
  }

  /**
   * Register a new strategy
   */
  static registerStrategy(name: string, strategy: ITypeDetectionStrategy): void {
    this.strategies.set(name, strategy);
  }
}

/**
 * Default strategy name
 */
export const DEFAULT_TYPE_DETECTION_STRATEGY = "sign-based";

/**
 * Get default type detection strategy for a bank
 */
export function getDefaultStrategyForBank(
  bank?: BankEnum | null
): string {
  if (bank === "AMERICAN_EXPRESS") {
    return "amex";
  }
  if (bank === "ING") {
    return "ing";
  }
  return DEFAULT_TYPE_DETECTION_STRATEGY;
}

