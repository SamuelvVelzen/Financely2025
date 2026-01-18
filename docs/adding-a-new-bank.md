# Adding a New Bank to CSV Import

This guide explains how to add support for a new bank in the CSV import system, including column mapping hints and transaction type detection strategies.

## Overview

When adding a new bank, you need to:

1. **Add the bank to the bank enum** - Register it in the system
2. **Create a bank profile** - Define column name hints for auto-detection
3. **Add filename detection** (optional) - Enable automatic bank detection from filename patterns
4. **Create a type detection strategy** (if needed) - Define how to determine EXPENSE vs INCOME
5. **Register the bank-to-strategy mapping** - Link the bank to its strategy

## Step-by-Step Guide

### Step 1: Add Bank to Bank Enum

**File**: `src/features/transaction/config/banks.ts`

Add your bank to the `BANK_VALUES` array and `BANK_LABELS` object:

```typescript
export const BANK_VALUES = [
  "AMERICAN_EXPRESS",
  "ING",
  "N26",
  "YOUR_NEW_BANK", // Add here
] as const;

export const BANK_LABELS: Record<BankEnum, string> = {
  AMERICAN_EXPRESS: "American Express",
  ING: "ING",
  N26: "N26",
  YOUR_NEW_BANK: "Your New Bank Name", // Add here
};
```

### Step 2: Create Bank Profile

**File**: `src/features/transaction/services/banks/your-new-bank.profile.ts`

Create a new profile file with column hints. Column hints help the system automatically detect which CSV columns map to which transaction fields.

```typescript
import type { BankProfile } from "../bank.factory";

export const yourNewBankProfile: BankProfile = {
  // Column hints: array of possible column names for each field
  columnHints: {
    occurredAt: ["Date", "Transaction Date", "Booking Date"],
    name: ["Description", "Payee", "Merchant", "Transaction Description"],
    amount: ["Amount", "Amount (EUR)", "Value"],
    currency: ["Currency", "Currency Code", "CCY"],
    type: ["Type", "Transaction Type"], // Only needed if using column-based strategy
    description: ["Notes", "Memo", "Details"],
    notes: ["Reference", "Notes"],
    externalId: ["Reference Number", "Transaction ID"],
    tags: ["Tags", "Categories"],
  },
  // Required fields: fields that MUST be mapped (cannot be auto-detected)
  requiredFields: [], // e.g., ["type"] if bank requires explicit type column
  // Default payment method: REQUIRED - used when paymentMethod is not mapped in CSV
  // If no bank is selected, falls back to "DEBIT_CARD"
  defaultPaymentMethod: "DEBIT_CARD", // or "CREDIT_CARD", "CASH", etc.
};
```

**Available Transaction Fields:**

- `occurredAt` - Transaction date (required)
- `name` - Transaction name/description (required)
- `amount` - Transaction amount (required)
- `currency` - Currency code (required)
- `type` - Transaction type: EXPENSE or INCOME (required for column-based strategies)
- `paymentMethod` - Payment method (optional, will use bank default if not mapped)
- `description` - Additional description (optional)
- `notes` - Notes (optional)
- `externalId` - External reference ID (optional)
- `tags` - Comma-separated tags (optional)

**Default Payment Method:**

The `defaultPaymentMethod` field is **REQUIRED** and specifies which payment method to use when importing CSV transactions if the `paymentMethod` field is not mapped or not provided in the CSV. This provides a better user experience by automatically setting a sensible default based on the bank type.

**Available Payment Methods:**
- `"CASH"` - Physical cash
- `"CREDIT_CARD"` - Credit card payment
- `"DEBIT_CARD"` - Debit card payment (typical for most banks, also used as fallback)
- `"BANK_TRANSFER"` - Bank transfer/wire transfer
- `"CHECK"` - Check payment
- `"DIGITAL_WALLET"` - Digital wallets (PayPal, Venmo, etc.)
- `"CRYPTOCURRENCY"` - Cryptocurrency payment
- `"GIFT_CARD"` - Gift card payment
- `"OTHER"` - Other payment methods

**Examples:**
- Credit card companies (like American Express): `defaultPaymentMethod: "CREDIT_CARD"`
- Traditional banks (like ING, N26): `defaultPaymentMethod: "DEBIT_CARD"`
- **Fallback**: If no bank is selected or bank profile is missing, defaults to `"DEBIT_CARD"`

**Tips:**

- Include common variations of column names (e.g., "Date", "Transaction Date", "Booking Date")
- Include translations if the bank uses non-English column names
- Order hints by likelihood (most common first)

### Step 2.5: Add Filename Detection (Optional)

**File**: `src/features/transaction/services/banks/your-new-bank.profile.ts`

If your bank uses a consistent filename pattern for exported CSV files, you can add automatic bank detection based on the filename. This will automatically select the bank when a user uploads a file matching the pattern.

Add a `detectBankByFilename` function to your bank profile:

```typescript
export const yourNewBankProfile: BankProfile = {
  columnHints: { /* ... */ },
  requiredFields: [],
  defaultPaymentMethod: "DEBIT_CARD",
  // Optional: detect bank from filename pattern
  detectBankByFilename: (filename: string) => {
    // Return true if filename matches your bank's pattern
    // Examples:
    
    // Pattern 1: Exact prefix match
    // if (filename.toLowerCase().startsWith("yourbank-")) {
    //   return true;
    // }
    
    // Pattern 2: Regex pattern
    // const pattern = /^yourbank_\d{4}-\d{2}-\d{2}\.csv$/i;
    // return pattern.test(filename);
    
    // Pattern 3: Multiple patterns
    // const patterns = [
    //   /^yourbank/i,
    //   /statement_\d{8}\.csv$/i,
    // ];
    // return patterns.some(p => p.test(filename));
    
    return false; // No pattern match
  },
};
```

**Examples:**

**ING Bank** - Detects files matching pattern `NL[digits]INGB[digits]_[date]_[date].csv`:
```typescript
detectBankByFilename: (filename: string) => {
  const ingPattern = /^NL\d{2}INGB\d+_\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{4}(\.csv)?$/i;
  return ingPattern.test(filename);
},
```

**American Express** - Detects files starting with "activity" or "activiteit":
```typescript
detectBankByFilename: (filename: string) => {
  const amexPattern = /^(activity|activiteit)/i;
  return amexPattern.test(filename);
},
```

**Tips:**

- Use case-insensitive matching (`/i` flag) for better user experience
- Test your regex patterns with various filename formats
- Keep patterns specific enough to avoid false positives
- If your bank doesn't have a consistent filename pattern, you can omit this function

**How It Works:**

When a user selects a CSV file in the upload step:
1. The system checks all bank profiles for filename patterns
2. If a match is found, the bank is automatically selected
3. The user can still manually change the bank selection if needed
4. Detection only runs when no bank is currently selected (or when "DEFAULT" is selected)

### Step 3: Register Bank Profile

**File**: `src/features/transaction/services/bank.factory.ts`

Import and register your new profile:

```typescript
import { yourNewBankProfile } from "./banks/your-new-bank.profile";

const BANK_REGISTRY: Record<BankEnum, BankProfile> = {
  AMERICAN_EXPRESS: americanExpressProfile,
  ING: ingProfile,
  N26: n26Profile,
  YOUR_NEW_BANK: yourNewBankProfile, // Add here
};
```

### Step 4: Create Type Detection Strategy (If Needed)

**File**: `src/features/transaction/services/csv-type-detection.ts`

You only need to create a custom strategy if the bank doesn't use the default detection.

#### Option A: Use Default Strategy

If your bank uses standard conventions:

- **Negative amounts** = EXPENSE
- **Positive amounts** = INCOME

No additional code needed! Skip to Step 5.

#### Option B: Create Inverted Strategy

If your bank inverts the signs (like Amex):

- **Negative amounts** = INCOME
- **Positive amounts** = EXPENSE

```typescript
export class YourNewBankTypeDetection implements ITypeDetectionStrategy {
  detectType(context: ITypeDetectionContext): ITransactionType {
    const amount = parseFloat(context.amount);
    // Inverted: negative = income, positive = expense
    return amount < 0 ? "INCOME" : "EXPENSE";
  }

  getName(): string {
    return "Your New Bank Format";
  }

  getDescription(): string {
    return "Negative amounts are income, positive amounts are expenses";
  }
}
```

#### Option C: Create Column-Based Strategy

If your bank uses a column to indicate debit/credit (like ING):

```typescript
export class YourNewBankTypeDetection implements ITypeDetectionStrategy {
  detectType(context: ITypeDetectionContext): ITransactionType {
    if (!context.mapping?.type) {
      throw new Error(
        "Your New Bank strategy requires 'type' field to be mapped to debit/credit column"
      );
    }

    const typeColumn = context.mapping.type;
    const typeValue = context.row[typeColumn]?.trim().toLowerCase() || "";

    // Map your bank's values to EXPENSE/INCOME
    if (typeValue === "debit" || typeValue === "withdrawal") {
      return "EXPENSE";
    } else if (typeValue === "credit" || typeValue === "deposit") {
      return "INCOME";
    } else {
      throw new Error(
        `Invalid type value "${context.row[typeColumn]}". Expected "debit" or "credit"`
      );
    }
  }

  getName(): string {
    return "Your New Bank Format";
  }

  getDescription(): string {
    return "Uses debit/credit column: debit = expense, credit = income";
  }
}
```

**Important Notes for Column-Based Strategies:**

- The `type` field **must** be mapped in the bank profile's `columnHints.type`
- The strategy will throw an error if the type column is not mapped
- Make sure to handle case-insensitive matching
- Support multiple value formats if the bank uses variations

### Step 5: Register Type Detection Strategy

**File**: `src/features/transaction/services/csv-type-detection.ts`

If you created a custom strategy, register it in the factory:

```typescript
export class TypeDetectionFactory {
  private static strategies: Map<string, ITypeDetectionStrategy> = new Map([
    ["default", new SignBasedTypeDetection()],
    ["amex", new AmexTypeDetection()],
    ["ing", new IngTypeDetection()],
    ["your-new-bank", new YourNewBankTypeDetection()], // Add here
  ]);
}
```

### Step 6: Map Bank to Strategy

**File**: `src/features/transaction/services/csv-type-detection.ts`

Update the `getDefaultStrategyForBank()` function:

```typescript
export function getDefaultStrategyForBank(bank?: BankEnum | null): string {
  if (bank === "AMERICAN_EXPRESS") {
    return "amex";
  }
  if (bank === "ING") {
    return "ing";
  }
  if (bank === "YOUR_NEW_BANK") {
    return "your-new-bank"; // Add here (or "default" if using default)
  }
  return DEFAULT_TYPE_DETECTION_STRATEGY;
}
```

### Step 7: Create Description Extraction Strategy (Optional)

**File**: `src/features/transaction/services/csv-description-extraction.ts`

You only need to create a custom description extraction strategy if your bank has complex metadata fields that need parsing (like ING's Notifications field).

#### Option A: Use Default Strategy

If your bank's CSV has straightforward name and description fields that can be used as-is, no additional code is needed! The default strategy will pass through the mapped fields directly.

#### Option B: Create Custom Strategy

If your bank stores important metadata in a single field (like ING's Notifications field), you can create a custom extraction strategy:

```typescript
export class YourNewBankDescriptionExtraction
  implements IDescriptionExtractionStrategy
{
  extractDescription(
    context: IDescriptionExtractionContext
  ): IExtractedDescription {
    const nameColumn = context.mapping.name;
    const descriptionColumn = context.mapping.description;

    const name = nameColumn ? context.row[nameColumn]?.trim() || "" : "";
    const metadataField = descriptionColumn
      ? context.row[descriptionColumn]?.trim() || ""
      : "";

    // Extract description from metadata field using regex patterns
    const extractedDescription = this.extractFromMetadata(metadataField);

    // Optionally enhance the name field
    const enhancedName = this.enhanceName(name, extractedDescription);

    // Extract date/time from metadata if available (optional)
    const { dateTime, valueDate } =
      this.extractDateTimeFromMetadata(metadataField);

    return {
      name: enhancedName,
      description: extractedDescription || null,
      dateTime: dateTime || null,
      valueDate: valueDate || null,
    };
  }

  private extractFromMetadata(metadata: string): string | null {
    // Your custom extraction logic here
    // Example: Look for "Description: ..." pattern
    const match = metadata.match(/Description:\s*([^\n]+)/i);
    return match ? match[1].trim() : null;
  }

  private enhanceName(name: string, description: string | null): string {
    // Optionally combine name and description
    if (description && this.isGenericName(name)) {
      return `${name} | ${description.substring(0, 50)}`;
    }
    return name;
  }

  private isGenericName(name: string): boolean {
    // Detect if name is generic (e.g., person name)
    return /^(Mr|Mrs|Ms|Dr)\.?\s+/.test(name);
  }

  private extractDateTimeFromMetadata(metadata: string): {
    dateTime: string | null;
    valueDate: string | null;
  } {
    // Optional: Extract date/time if your bank includes it in metadata
    // Example patterns:
    // - "Date/time: DD-MM-YYYY HH:MM:SS"
    // - "Value date: DD/MM/YYYY"
    return { dateTime: null, valueDate: null };
  }

  getName(): string {
    return "Your New Bank Format";
  }

  getDescription(): string {
    return "Extracts descriptions from metadata field";
  }
}
```

**Register the strategy:**

```typescript
export class DescriptionExtractionFactory {
  private static strategies: Map<string, IDescriptionExtractionStrategy> =
    new Map([
      ["default", new DefaultDescriptionExtraction()],
      ["ing", new IngDescriptionExtraction()],
      ["your-new-bank", new YourNewBankDescriptionExtraction()], // Add here
    ]);
}
```

**Map bank to strategy:**

```typescript
export function getDefaultDescriptionExtractionForBank(
  bank?: BankEnum | null
): string {
  if (bank === "ING") {
    return "ing";
  }
  if (bank === "YOUR_NEW_BANK") {
    return "your-new-bank"; // Add here (or "default" if using default)
  }
  return "default";
}
```

**Example: ING Strategy**

The ING strategy extracts descriptions from the Notifications field using multiple patterns:

1. **Explicit Description**: `"Description: Apple icloud 17th"` → extracts `"Apple icloud 17th"`
2. **Name + Description**: `"Name: Hr SIH van Velzen Description: Apple icloud 17th"` → extracts description
3. **Card Transactions**: Extracts merchant/service info from card sequence patterns
4. **SEPA Direct Debits**: Extracts description before IBAN field
5. **Transfers**: Handles "To ... Afronding" patterns

It also enhances person names by combining them with descriptions:

- Input: Name = `"Hr SIH van Velzen"`, Notifications = `"Description: Apple icloud 17th"`
- Output: Name = `"Hr SIH van Velzen | Apple icloud 17th"`, Description = `"Apple icloud 17th"`

**Date/Time Extraction:**

The ING strategy also extracts date/time information from notifications:

1. **Date/time pattern**: `"Date/time: 14-12-2025 12:28:57"` → extracts and parses to ISO format
   - Format: `DD-MM-YYYY HH:MM:SS`
   - Most precise (includes time)
   - Overrides the main `occurredAt` field when found

2. **Value date pattern**: `"Value date: 14/12/2025"` → extracts and parses to ISO format
   - Format: `DD/MM/YYYY`
   - Less precise (date only, defaults to midnight)
   - Used as fallback if Date/time is not found

**Priority order for dates:**

1. `Date/time` from notifications (most precise)
2. `Value date` from notifications (fallback)
3. Mapped `occurredAt` field from CSV (existing behavior)

**Example:**

- CSV Date field: `20251221`
- Notifications: `"Date/time: 14-12-2025 12:28:57 Value date: 14/12/2025"`
- Result: `occurredAt` = `"2025-12-14T12:28:57.000Z"` (uses Date/time, overriding CSV date)

## Examples

### Example 1: Simple Bank (Default Strategy)

**Bank**: SimpleBank

- Uses standard default detection
- CSV columns: "Date", "Description", "Amount", "Currency"

**Steps:**

1. Add `"SIMPLE_BANK"` to `banks.ts`
2. Create `simple-bank.profile.ts` with column hints
3. Register profile in `bank.factory.ts`
4. Map to `"default"` strategy in `getDefaultStrategyForBank()`

### Example 2: Bank with Inverted Signs

**Bank**: InvertedBank

- Negative amounts = INCOME
- Positive amounts = EXPENSE

**Steps:**

1. Add bank enum
2. Create profile
3. Create `InvertedBankTypeDetection` strategy class
4. Register strategy as `"inverted-bank"`
5. Map bank to `"inverted-bank"` strategy

### Example 3: Bank with Debit/Credit Column

**Bank**: ColumnBank

- Uses "Transaction Type" column with values "Debit" or "Credit"
- "Debit" = EXPENSE, "Credit" = INCOME

**Steps:**

1. Add bank enum
2. Create profile with `type: ["Transaction Type", "Type"]` in columnHints
3. Create `ColumnBankTypeDetection` strategy that reads the column
4. Register strategy
5. Map bank to strategy
6. **Important**: Ensure `type` field is marked as required in validation

## Testing Your Implementation

1. **Test Column Detection:**
   - Upload a CSV with your bank's column names
   - Verify columns are auto-detected correctly
   - Check that the mapping step shows correct suggestions

2. **Test Type Detection:**
   - For default: Test with positive and negative amounts
   - For column-based: Test with different debit/credit values
   - Verify transactions show correct EXPENSE/INCOME types in review step

3. **Test Description Extraction:**
   - For custom strategies: Test with various notification/metadata formats
   - Verify descriptions are extracted correctly
   - Check name enhancement works as expected
   - Test fallback behavior when extraction returns null

4. **Test Validation:**
   - For column-based strategies: Ensure type field is required
   - Verify error messages are clear if type column is missing

## File Structure Summary

```
src/features/transaction/
├── config/
│   └── banks.ts                          # Step 1: Add bank enum
├── services/
│   ├── bank.factory.ts                   # Step 3: Register profile
│   ├── csv-type-detection.ts             # Steps 4-6: Type detection strategy
│   ├── csv-description-extraction.ts     # Step 7: Description extraction strategy
│   └── banks/
│       └── your-new-bank.profile.ts      # Step 2: Create profile
```

## Common Patterns

### Pattern 1: Standard Bank (Most Common)

- Use default `"default"` strategy
- Only need to create profile with column hints

### Pattern 2: Inverted Signs

- Create strategy that inverts sign logic
- Common for credit card statements

### Pattern 3: Debit/Credit Column

- Create column-based strategy
- Must include `type` in columnHints
- Must mark `type` as required in validation

## Troubleshooting

**Columns not auto-detecting?**

- Check that column names in hints match CSV exactly (case-insensitive)
- Add more variations to `columnHints` array
- Check normalization logic handles your column names

**Type detection not working?**

- Verify strategy is registered in `TypeDetectionFactory`
- Check bank is mapped in `getDefaultStrategyForBank()`
- For column-based: Ensure `type` field is mapped in profile

**Description extraction not working?**

- Verify strategy is registered in `DescriptionExtractionFactory`
- Check bank is mapped in `getDefaultDescriptionExtractionForBank()`
- Test regex patterns match your bank's notification format
- Verify description column is mapped in profile

**Validation failing?**

- For column-based strategies: Ensure `type` field is required
- Check validation logic in `validateMapping()` function

## Additional Resources

- See existing implementations:
  - `src/features/transaction/services/banks/ing.profile.ts` - Column-based example
  - `src/features/transaction/services/banks/american-express.profile.ts` - Inverted sign example
  - `src/features/transaction/services/csv-type-detection.ts` - Type detection strategy examples
  - `src/features/transaction/services/csv-description-extraction.ts` - Description extraction strategy examples (ING)
  - `src/features/transaction/services/csv-date-parsing.ts` - Date parsing strategy examples
