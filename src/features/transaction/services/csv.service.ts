import { SUPPORTED_CURRENCIES } from "@/features/currency/config/currencies";
import {
  CreateTransactionInputSchema,
  ICreateTransactionInput,
  type ICsvCandidateTransaction,
  type ICsvFieldMapping,
  type ICurrency,
  type ITransactionType,
} from "@/features/shared/validation/schemas";
import { TagService } from "@/features/tag/services/tag.service";
import { prisma } from "@/features/util/prisma";
import type { BankEnum } from "../config/banks";
import {
  PAYMENT_METHOD_VALUES,
  type IPaymentMethod,
} from "../config/payment-methods";
import {
  SYSTEM_REQUIRED_FIELDS,
  type ITransactionFieldName,
} from "../config/transaction-fields";
import { BankProfileFactory } from "./bank.factory";
import { DateParsingFactory } from "./csv-date-parsing";
import {
  DescriptionExtractionFactory,
  getDefaultDescriptionExtractionForBank,
  type IDescriptionExtractionContext,
} from "./csv-description-extraction";
import {
  DEFAULT_TYPE_DETECTION_STRATEGY,
  TypeDetectionFactory,
  type ITypeDetectionContext,
} from "./csv-type-detection";

/**
 * CSV Import Service
 * Handles CSV parsing, field mapping, and validation
 */

// Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ROWS = 10000;
export const BATCH_SIZE = 100;

// Field name heuristics for auto-detection
const FIELD_NAME_PATTERNS: Record<string, string[]> = {
  type: ["type", "transaction_type", "kind", "category"],
  amount: ["amount", "value", "betrag", "sum", "total", "price", "cost"],
  currency: ["currency", "curr", "ccy", "währung"],
  transactionDate: [
    "date",
    "transaction_date",
    "booking date",
    "datum",
    "occurred_at",
    "timestamp",
    "time",
  ],
  name: ["name", "title", "description", "memo", "payee", "merchant", "vendor"],
  description: ["description", "desc", "details", "note", "memo"],
  notes: ["notes", "note", "remarks", "comments"],
  externalId: ["external_id", "externalid", "id", "reference", "ref"],
  paymentMethod: [
    "payment_method",
    "paymentmethod",
    "payment",
    "method",
    "payment_type",
    "paymenttype",
    "pay_method",
    "paymethod",
  ],
  tags: ["tags", "categories"],
  primaryTag: [
    "tag",
    "category",
    "primary_tag",
    "primary tag",
    "primarytag",
    "budget_tag",
    "budget tag",
    "budgettag",
    "main_tag",
    "main tag",
  ],
};

/**
 * Detect CSV delimiter by analyzing the first line
 * Common delimiters: comma, semicolon, tab, pipe
 */
function detectDelimiter(firstLine: string): string {
  const delimiters = [",", ";", "\t", "|"];
  let maxCount = 0;
  let detectedDelimiter = ","; // Default to comma

  for (const delimiter of delimiters) {
    // Count occurrences, but ignore those inside quotes
    let count = 0;
    let inQuotes = false;
    for (let i = 0; i < firstLine.length; i++) {
      const char = firstLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        count++;
      }
    }
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }

  return detectedDelimiter;
}

/**
 * Parse CSV headers from file
 */
export async function parseCsvHeaders(
  file: File | { text(): Promise<string> }
): Promise<string[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Detect delimiter from first line
  const delimiter = detectDelimiter(lines[0]);

  // Parse first line as headers
  const headers = parseCsvLine(lines[0], delimiter);
  return headers.map((h) => h.trim());
}

/**
 * Parse all CSV rows from file (returns columns and all rows)
 */
export async function parseAllCsvRows(
  file: File | { text(): Promise<string> }
): Promise<{
  columns: string[];
  rows: Record<string, string>[];
}> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Detect delimiter from first line
  const delimiter = detectDelimiter(lines[0]);

  // Parse headers
  const columns = parseCsvLine(lines[0], delimiter).map((h) => h.trim());

  if (lines.length < 2) {
    return { columns, rows: [] };
  }

  // Parse all data rows
  const dataLines = lines.slice(1);
  const rows = dataLines.map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    columns.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });
    return row;
  });

  return { columns, rows };
}

/**
 * Parse CSV rows with pagination (used by Tag CSV import)
 */
export async function parseCsvRows(
  file: File | { text(): Promise<string> },
  mapping: ICsvFieldMapping,
  page: number,
  limit: number
): Promise<{
  rows: Record<string, string>[];
  total: number;
}> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return { rows: [], total: 0 };
  }

  // Detect delimiter from first line
  const delimiter = detectDelimiter(lines[0]);

  // Parse headers
  const headers = parseCsvLine(lines[0], delimiter).map((h) => h.trim());

  // Parse data rows
  const dataLines = lines.slice(1);
  const total = dataLines.length;

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLines = dataLines.slice(startIndex, endIndex);

  const rows = paginatedLines.map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });
    return row;
  });

  return { rows, total };
}

/**
 * Simple CSV line parser (handles quoted fields and custom delimiters)
 */
function parseCsvLine(line: string, delimiter: string = ","): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);
  return result;
}

type NormalizedColumn = {
  original: string;
  normalized: string;
};

const normalizeColumnName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[_\s-]+/g, "_");

export interface IAutoMappingResult {
  mapping: Partial<ICsvFieldMapping>;
  metadata: {
    bank?: BankEnum;
  };
}

/**
 * Auto-detect field mapping from column names
 */
export function autoDetectMapping(
  columns: string[],
  bank?: BankEnum | null
): IAutoMappingResult {
  const mapping: Partial<ICsvFieldMapping> = {};
  const normalizedColumns: NormalizedColumn[] = columns.map((col) => ({
    original: col,
    normalized: normalizeColumnName(col),
  }));
  const usedColumnIndexes = new Set<number>();

  const applyHints = (
    hints: Partial<Record<ITransactionFieldName, string[]>> | undefined
  ) => {
    if (!hints) return;

    Object.entries(hints).forEach(([field, columnHints]) => {
      if (!columnHints || mapping[field as ITransactionFieldName]) {
        return;
      }
      const normalizedHints = columnHints.map((hint) =>
        normalizeColumnName(hint)
      );

      // First pass: look for exact matches (check hints in order, then find matching column)
      for (const hint of normalizedHints) {
        for (let i = 0; i < normalizedColumns.length; i++) {
          if (usedColumnIndexes.has(i)) continue;
          const normalizedCol = normalizedColumns[i].normalized;

          if (normalizedCol === hint) {
            mapping[field as ITransactionFieldName] =
              normalizedColumns[i].original;
            usedColumnIndexes.add(i);
            break; // Found match for this hint, move to next hint
          }
        }

        if (mapping[field as ITransactionFieldName]) break; // Found exact match, stop
      }

      // Second pass: look for substring matches (only if no exact match found)
      if (!mapping[field as ITransactionFieldName]) {
        for (const hint of normalizedHints) {
          for (let i = 0; i < normalizedColumns.length; i++) {
            if (usedColumnIndexes.has(i)) continue;
            const normalizedCol = normalizedColumns[i].normalized;

            if (normalizedCol.includes(hint) || hint.includes(normalizedCol)) {
              mapping[field as ITransactionFieldName] =
                normalizedColumns[i].original;
              usedColumnIndexes.add(i);
              break; // Found match for this hint, move to next hint
            }
          }
          if (mapping[field as ITransactionFieldName]) break; // Found match, stop
        }
      }
    });
  };

  // Apply bank-specific hints first for higher priority
  const bankHints = BankProfileFactory.getColumnHints(bank);
  applyHints(bankHints);

  // Fallback to generic heuristics for remaining fields
  // Process primaryTag before tags to ensure "Tag" column maps to primaryTag, not tags
  const fallbackFields = Object.entries(FIELD_NAME_PATTERNS);
  const primaryTagEntry = fallbackFields.find(
    ([field]) => field === "primaryTag"
  );
  const otherFields = fallbackFields.filter(
    ([field]) => field !== "primaryTag"
  );
  const orderedFields = primaryTagEntry
    ? [primaryTagEntry, ...otherFields]
    : fallbackFields;

  orderedFields.forEach(([field, patterns]) => {
    if (mapping[field as ITransactionFieldName]) {
      return;
    }
    const normalizedPatterns = patterns.map((p) => normalizeColumnName(p));

    for (let i = 0; i < normalizedColumns.length; i++) {
      if (usedColumnIndexes.has(i)) continue;
      const normalizedCol = normalizedColumns[i].normalized;

      // First check for exact match (highest priority)
      const exactMatch = normalizedPatterns.some(
        (pattern) => normalizedCol === pattern
      );

      // Then check for substring matches (only if no exact match)
      const substringMatch =
        !exactMatch &&
        normalizedPatterns.some(
          (pattern) =>
            normalizedCol.includes(pattern) ||
            (pattern.length > normalizedCol.length &&
              pattern.includes(normalizedCol))
        );

      if (exactMatch || substringMatch) {
        mapping[field as ITransactionFieldName] = normalizedColumns[i].original;
        usedColumnIndexes.add(i);
        break;
      }
    }
  });

  return {
    mapping,
    metadata: {
      bank: bank || undefined,
    },
  };
}

/**
 * Validate mapping against required fields
 */
export function validateMapping(
  mapping: ICsvFieldMapping,
  requiredFields: readonly string[],
  bank?: BankEnum | null,
  hasDefaultCurrency?: boolean
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  // Get bank-specific required fields (e.g., ING requires "type")
  const bankRequiredFields = BankProfileFactory.getRequiredFields(bank);

  for (const field of requiredFields) {
    // Skip type field unless bank profile requires it
    if (field === "type" && !bankRequiredFields.includes("type")) {
      continue;
    }
    // Skip currency field if defaultCurrency is provided
    if (field === "currency" && hasDefaultCurrency) {
      continue;
    }
    const mappedColumn = mapping[field];
    if (!mappedColumn || mappedColumn.trim() === "") {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Convert CSV row to candidate transaction
 */
export async function convertRowToTransaction(
  row: Record<string, string>,
  mapping: ICsvFieldMapping,
  userId: string,
  typeDetectionStrategy: string,
  defaultCurrency?: ICurrency,
  bank?: BankEnum | null
): Promise<Partial<ICreateTransactionInput>> {
  const transaction: Partial<ICreateTransactionInput> = {};

  // Set default currency if provided
  if (defaultCurrency) {
    transaction.currency = defaultCurrency;
  }

  // Map each field first to get amount
  let parsedAmount: string | undefined;
  for (const [field, column] of Object.entries(mapping)) {
    if (!column) continue;
    const rawValue = row[column]?.trim() || "";

    if (field === "amount" && rawValue) {
      parsedAmount = parseAmount(rawValue);
    }
  }

  // Determine type using strategy
  if (parsedAmount && typeDetectionStrategy) {
    // Use type detection strategy (strategy will handle whether it needs type column or not)
    const strategy = TypeDetectionFactory.getStrategy(typeDetectionStrategy);
    const context: ITypeDetectionContext = {
      amount: parsedAmount,
      rawAmount: row[mapping.amount || ""] || "",
      row,
      mapping,
    };
    transaction.type = strategy.detectType(context);
  } else if (parsedAmount) {
    // Fallback to default strategy
    const strategy = TypeDetectionFactory.getStrategy(
      DEFAULT_TYPE_DETECTION_STRATEGY
    );
    const context: ITypeDetectionContext = {
      amount: parsedAmount,
      rawAmount: row[mapping.amount || ""] || "",
      row,
      mapping,
    };
    transaction.type = strategy.detectType(context);
  }

  // Extract description using strategy
  const descriptionStrategyName = getDefaultDescriptionExtractionForBank(bank);
  const descriptionStrategy = DescriptionExtractionFactory.getStrategy(
    descriptionStrategyName
  );
  const descriptionContext: IDescriptionExtractionContext = {
    row,
    mapping,
    bank,
  };
  const extracted = descriptionStrategy.extractDescription(descriptionContext);

  // Map each field
  for (const [field, column] of Object.entries(mapping)) {
    if (!column) continue;

    const rawValue = row[column]?.trim() || "";

    switch (field as ITransactionFieldName) {
      case "type":
        // Skip - already handled above
        break;
      case "amount":
        transaction.amount = parseAmount(rawValue);
        break;
      case "currency":
        // Only parse currency from CSV if defaultCurrency is not provided
        if (!defaultCurrency) {
          transaction.currency = parseCurrency(rawValue);
        }
        break;
      case "transactionDate":
        // Priority: Use extracted date/time from notifications if available
        // 1. Use dateTime (most precise, includes time)
        // 2. Fallback to valueDate (date only)
        // 3. Fallback to mapped date field (existing behavior)
        if (extracted.dateTime) {
          // Extracted datetime has time component
          const dateObj = new Date(extracted.dateTime);
          transaction.transactionDate = extracted.dateTime;
          transaction.timePrecision = "DateTime";
        } else if (extracted.valueDate) {
          // Extracted valueDate is date-only
          const dateObj = new Date(extracted.valueDate);
          const dateOnly = dateObj.toISOString().split("T")[0];
          transaction.transactionDate = `${dateOnly}T12:00:00.000Z`; // Placeholder time for DateOnly
          transaction.timePrecision = "DateOnly";
        } else {
          // Parse using date parsing strategy
          const dateStrategy = DateParsingFactory.getStrategy(bank);
          const parseResult = dateStrategy.parseDate(rawValue);
          transaction.transactionDate = parseResult.isoString;
          transaction.timePrecision = parseResult.precision;
        }
        break;
      case "name":
        // Use enhanced name from description extraction
        transaction.name = extracted.name || rawValue;
        break;
      case "description":
        // Use extracted description
        transaction.description = extracted.description || null;
        break;
      case "notes":
        transaction.notes = rawValue || null;
        break;
      case "externalId":
        transaction.externalId = rawValue || null;
        break;
      case "paymentMethod":
        transaction.paymentMethod = parsePaymentMethod(rawValue);
        break;
      case "tags":
        if (rawValue) {
          // Store tag names instead of resolving to IDs
          // Tag names will be resolved during import confirmation
          transaction.tagIds = parseTagNames(rawValue);
        }
        break;
      case "primaryTag":
        if (rawValue) {
          // Store primary tag name instead of resolving to ID
          // Tag name will be resolved during import confirmation
          transaction.primaryTagId = rawValue.trim();
        }
        break;
    }
  }

  // Set default payment method from bank if not already set from CSV mapping
  if (!transaction.paymentMethod) {
    transaction.paymentMethod =
      BankProfileFactory.getDefaultPaymentMethod(bank);
  }

  return transaction;
}

/**
 * Parse transaction type
 */
function parseType(value: string): "EXPENSE" | "INCOME" {
  const normalized = value.toUpperCase().trim();
  if (normalized === "INCOME" || normalized === "IN" || normalized === "I") {
    return "INCOME";
  }
  return "EXPENSE"; // Default
}

/**
 * Parse amount (handles decimal separators)
 */
function parseAmount(value: string): string {
  // Remove currency symbols and whitespace
  let cleaned = value.replace(/[^\d.,-]/g, "").trim();

  // Handle negative amounts
  const isNegative = cleaned.startsWith("-");
  cleaned = cleaned.replace(/^-/, "");

  // Determine decimal separator
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let decimalSeparator = ".";
  if (lastComma > lastDot) {
    decimalSeparator = ",";
  }

  // Normalize to dot as decimal separator
  if (decimalSeparator === ",") {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }

  const result = isNegative ? `-${cleaned}` : cleaned;
  return result;
}

/**
 * Parse currency
 */
function parseCurrency(value: string): ICurrency {
  const normalized = value.toUpperCase().trim();
  if (SUPPORTED_CURRENCIES.includes(normalized as ICurrency)) {
    return normalized as ICurrency;
  }
  return "USD"; // Default
}

/**
 * Parse payment method
 * Normalizes common variations to valid payment method values
 */
function parsePaymentMethod(value: string): IPaymentMethod {
  if (!value) return "OTHER";

  const normalized = value
    .toUpperCase()
    .trim()
    .replace(/[_\s-]+/g, "_");

  // Check for exact match first
  if (PAYMENT_METHOD_VALUES.includes(normalized as IPaymentMethod)) {
    return normalized as IPaymentMethod;
  }

  // Handle common variations
  const variations: Record<string, IPaymentMethod> = {
    CASH: "CASH",
    CREDIT: "CREDIT_CARD",
    CREDITCARD: "CREDIT_CARD",
    DEBIT: "DEBIT_CARD",
    DEBITCARD: "DEBIT_CARD",
    BANK_TRANSFER: "BANK_TRANSFER",
    TRANSFER: "BANK_TRANSFER",
    WIRE: "BANK_TRANSFER",
    CHECK: "CHECK",
    CHEQUE: "CHECK",
    DIGITAL_WALLET: "DIGITAL_WALLET",
    WALLET: "DIGITAL_WALLET",
    PAYPAL: "DIGITAL_WALLET",
    VENMO: "DIGITAL_WALLET",
    APPLE_PAY: "DIGITAL_WALLET",
    GOOGLE_PAY: "DIGITAL_WALLET",
    CRYPTO: "CRYPTOCURRENCY",
    CRYPTOCURRENCY: "CRYPTOCURRENCY",
    GIFT_CARD: "GIFT_CARD",
    GIFTCARD: "GIFT_CARD",
  };

  const variation = variations[normalized];
  if (variation) {
    return variation;
  }

  // Default to OTHER if no match found
  return "OTHER";
}

/**
 * Parse tag names (comma-separated) and return as array of names
 * Tags will be resolved to IDs during import confirmation
 */
function parseTagNames(value: string): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/**
 * Fetch tag metadata by names for a user
 * Returns a map of tag name to tag metadata (color, emoticon, etc.)
 */
export async function fetchTagMetadataByNames(
  userId: string,
  tagNames: string[]
): Promise<
  Map<string, { id: string; color: string | null; emoticon: string | null }>
> {
  if (tagNames.length === 0) {
    return new Map();
  }

  const tags = await prisma.tag.findMany({
    where: {
      userId,
      name: {
        in: tagNames,
      },
    },
    select: {
      id: true,
      name: true,
      color: true,
      emoticon: true,
    },
  });

  const metadataMap = new Map<
    string,
    { id: string; color: string | null; emoticon: string | null }
  >();

  for (const tag of tags) {
    metadataMap.set(tag.name, {
      id: tag.id,
      color: tag.color,
      emoticon: tag.emoticon,
    });
  }

  return metadataMap;
}

/**
 * Parse tags (comma-separated names) and resolve to tagIds
 * Creates tags if they don't exist
 * This is used during import confirmation, not during CSV parsing
 */
export async function parseTags(
  value: string,
  userId: string,
  transactionType: ITransactionType
): Promise<string[]> {
  if (!value) return [];

  const tagNames = value
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  const tagIds: string[] = [];

  for (const tagName of tagNames) {
    // Try to find existing tag
    const existingTags = await prisma.tag.findMany({
      where: {
        userId,
        name: tagName,
      },
      take: 1,
    });

    if (existingTags.length > 0) {
      tagIds.push(existingTags[0].id);
    } else {
      // Create new tag
      try {
        const newTag = await TagService.createTag(userId, {
          name: tagName,
          transactionType,
        });
        tagIds.push(newTag.id);
      } catch (error) {
        // If tag creation fails (e.g., duplicate), try to find it again
        const retryTags = await prisma.tag.findMany({
          where: {
            userId,
            name: tagName,
          },
          take: 1,
        });
        if (retryTags.length > 0) {
          tagIds.push(retryTags[0].id);
        }
        // Otherwise, skip this tag
      }
    }
  }

  return tagIds;
}

/**
 * Parse a single primary tag name and resolve to tagId
 * Creates tag if it doesn't exist
 * This is used during import confirmation, not during CSV parsing
 */
export async function parsePrimaryTag(
  value: string,
  userId: string,
  transactionType: ITransactionType
): Promise<string | null> {
  if (!value || !value.trim()) return null;

  const tagName = value.trim();

  // Try to find existing tag matching name and transaction type
  const existingTags = await prisma.tag.findMany({
    where: {
      userId,
      name: tagName,
      transactionType,
    },
    take: 1,
  });

  if (existingTags.length > 0) {
    return existingTags[0].id;
  }

  // Create new tag with matching transaction type
  try {
    const newTag = await TagService.createTag(userId, {
      name: tagName,
      transactionType,
    });
    return newTag.id;
  } catch (error) {
    // If tag creation fails (e.g., duplicate), try to find it again
    const retryTags = await prisma.tag.findMany({
      where: {
        userId,
        name: tagName,
      },
      take: 1,
    });
    if (retryTags.length > 0) {
      return retryTags[0].id;
    }
    // Otherwise, return null (don't fail the import)
    return null;
  }
}

/**
 * Validate candidate transaction
 */
export function validateCandidateTransaction(
  candidate: Partial<ICreateTransactionInput>,
  typeDetectionStrategy?: string
): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = [];

  // Validate required fields
  for (const field of SYSTEM_REQUIRED_FIELDS) {
    // Skip type validation if type detection is enabled and type is not set
    // (it will be set during conversion)
    // But ING strategy requires type to be set
    if (
      field === "type" &&
      typeDetectionStrategy &&
      typeDetectionStrategy !== "ing" &&
      !candidate.type
    ) {
      continue;
    }
    if (!candidate[field as keyof ICreateTransactionInput]) {
      errors.push({
        field,
        message: `Required field ${field} is missing`,
      });
    }
  }

  // Try to validate with schema
  try {
    CreateTransactionInputSchema.parse(candidate);
  } catch (error: any) {
    if (error.errors) {
      for (const err of error.errors) {
        const field = err.path.join(".");
        errors.push({
          field,
          message: err.message || "Validation error",
        });
      }
    }
  }

  return errors;
}

/**
 * Convert rows to candidate transactions with validation
 */
export async function convertRowsToCandidates(
  rows: Record<string, string>[],
  mapping: ICsvFieldMapping,
  userId: string,
  typeDetectionStrategy: string,
  defaultCurrency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY",
  bank?: BankEnum | null
): Promise<ICsvCandidateTransaction[]> {
  const candidates: ICsvCandidateTransaction[] = [];
  const allTagNames = new Set<string>();
  const allPrimaryTagNames = new Set<string>();

  // First pass: convert rows and collect tag names
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const transaction = await convertRowToTransaction(
        row,
        mapping,
        userId,
        typeDetectionStrategy,
        defaultCurrency,
        bank
      );
      const errors = validateCandidateTransaction(
        transaction,
        typeDetectionStrategy
      );

      // Collect tag names for metadata lookup
      if (transaction.tagIds && Array.isArray(transaction.tagIds)) {
        transaction.tagIds.forEach((tagName) => {
          if (tagName && typeof tagName === "string") {
            allTagNames.add(tagName);
          }
        });
      }
      if (
        transaction.primaryTagId &&
        typeof transaction.primaryTagId === "string"
      ) {
        allPrimaryTagNames.add(transaction.primaryTagId);
      }

      // Determine status
      let status: "valid" | "invalid" | "warning" = "valid";
      if (errors.length > 0) {
        status = "invalid";
      }

      candidates.push({
        rowIndex: i,
        status,
        data: transaction as ICreateTransactionInput,
        primaryTagMetadata: null,
        tagsMetadata: [],
        errors,
      });
    } catch (error) {
      // Create a valid but empty transaction structure for invalid candidates
      candidates.push({
        rowIndex: i,
        status: "invalid",
        data: {
          type: "EXPENSE",
          amount: "0",
          currency: "EUR",
          transactionDate: new Date().toISOString(),
          name: "Invalid transaction",
          paymentMethod: "OTHER",
          tagIds: [],
        } as ICreateTransactionInput,
        primaryTagMetadata: null,
        tagsMetadata: [],
        errors: [
          {
            field: "general",
            message:
              error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
      });
    }
  }

  // Fetch tag metadata separately for primary tags and other tags
  const primaryTagNamesArray = Array.from(allPrimaryTagNames);
  const tagNamesArray = Array.from(allTagNames);

  const primaryTagMetadataMap = await fetchTagMetadataByNames(
    userId,
    primaryTagNamesArray
  );
  const tagsMetadataMap = await fetchTagMetadataByNames(userId, tagNamesArray);

  // Second pass: add tag metadata to candidates
  return candidates.map((candidate) => {
    // Populate primary tag metadata
    let primaryTagMetadata: {
      id?: string;
      name: string;
      color: string | null;
      emoticon: string | null;
    } | null = null;

    if (
      candidate.data.primaryTagId &&
      typeof candidate.data.primaryTagId === "string"
    ) {
      const primaryTagName = candidate.data.primaryTagId;
      const metadata = primaryTagMetadataMap.get(primaryTagName);
      if (metadata) {
        // Tag exists: include id, name, color, emoticon
        primaryTagMetadata = {
          id: metadata.id,
          name: primaryTagName,
          color: metadata.color,
          emoticon: metadata.emoticon,
        };
      } else {
        // Tag doesn't exist: include name only (no id)
        primaryTagMetadata = {
          name: primaryTagName,
          color: null,
          emoticon: null,
        };
      }
    }

    // Populate tags metadata (excluding primary tag)
    const tagsMetadata: Array<{
      id?: string;
      name: string;
      color: string | null;
      emoticon: string | null;
    }> = [];

    if (candidate.data.tagIds && Array.isArray(candidate.data.tagIds)) {
      const primaryTagName =
        candidate.data.primaryTagId &&
        typeof candidate.data.primaryTagId === "string"
          ? candidate.data.primaryTagId
          : null;

      candidate.data.tagIds.forEach((tagName) => {
        if (tagName && typeof tagName === "string") {
          // Exclude primary tag from tags metadata
          if (tagName === primaryTagName) {
            return;
          }

          const metadata = tagsMetadataMap.get(tagName);
          if (metadata) {
            // Tag exists: include id, name, color, emoticon
            tagsMetadata.push({
              id: metadata.id,
              name: tagName,
              color: metadata.color,
              emoticon: metadata.emoticon,
            });
          } else {
            // Tag doesn't exist: include name only (no id)
            tagsMetadata.push({
              name: tagName,
              color: null,
              emoticon: null,
            });
          }
        }
      });
    }

    return {
      ...candidate,
      primaryTagMetadata,
      tagsMetadata,
    };
  });
}
