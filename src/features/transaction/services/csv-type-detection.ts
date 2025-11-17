/**
 * Transaction Type Detection Strategies
 * Factory pattern for determining transaction type from CSV data
 */

export type ITransactionType = "EXPENSE" | "INCOME";

export interface ITypeDetectionContext {
  amount: string; // Parsed amount as string
  rawAmount: string; // Original raw amount value from CSV
  row: Record<string, string>; // Full CSV row data
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
 * (Placeholder - not yet implemented)
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
 * Type detection strategy factory
 */
export class TypeDetectionFactory {
  private static strategies: Map<string, ITypeDetectionStrategy> = new Map([
    ["sign-based", new SignBasedTypeDetection()],
    ["amex", new AmexTypeDetection()],
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

