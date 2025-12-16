# Adding a New Bank to CSV Import

This guide explains how to add support for a new bank in the CSV import system, including column mapping hints and transaction type detection strategies.

## Overview

When adding a new bank, you need to:

1. **Add the bank to the bank enum** - Register it in the system
2. **Create a bank profile** - Define column name hints for auto-detection
3. **Create a type detection strategy** (if needed) - Define how to determine EXPENSE vs INCOME
4. **Register the bank-to-strategy mapping** - Link the bank to its strategy

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
};
```

**Available Transaction Fields:**
- `occurredAt` - Transaction date (required)
- `name` - Transaction name/description (required)
- `amount` - Transaction amount (required)
- `currency` - Currency code (required)
- `type` - Transaction type: EXPENSE or INCOME (required for column-based strategies)
- `description` - Additional description (optional)
- `notes` - Notes (optional)
- `externalId` - External reference ID (optional)
- `tags` - Comma-separated tags (optional)

**Tips:**
- Include common variations of column names (e.g., "Date", "Transaction Date", "Booking Date")
- Include translations if the bank uses non-English column names
- Order hints by likelihood (most common first)

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
export function getDefaultStrategyForBank(
  bank?: BankEnum | null
): string {
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

3. **Test Validation:**
   - For column-based strategies: Ensure type field is required
   - Verify error messages are clear if type column is missing

## File Structure Summary

```
src/features/transaction/
├── config/
│   └── banks.ts                          # Step 1: Add bank enum
├── services/
│   ├── bank.factory.ts                   # Step 3: Register profile
│   ├── csv-type-detection.ts             # Steps 4-6: Strategy & mapping
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

**Validation failing?**
- For column-based strategies: Ensure `type` field is required
- Check validation logic in `validateMapping()` function

## Additional Resources

- See existing implementations:
  - `src/features/transaction/services/banks/ing.profile.ts` - Column-based example
  - `src/features/transaction/services/banks/american-express.profile.ts` - Inverted sign example
  - `src/features/transaction/services/csv-type-detection.ts` - All strategy examples

