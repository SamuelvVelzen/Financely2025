---
name: User Settings System
overview: Create a UserSetting table to store user preferences (defaultCurrency and defaultLanguage), add UI in the account page to manage these settings, and integrate the settings throughout the app with browser fallbacks.
todos:
  - id: schema
    content: Add UserSetting model to Prisma schema with defaultCurrency and defaultLanguage fields, create migration
    status: pending
  - id: validation
    content: Create validation schemas (UserSettingSchema, UpdateUserSettingInputSchema) in schemas.ts
    status: pending
    dependencies:
      - schema
  - id: service
    content: Create UserSettingService with getUserSetting, upsertUserSetting, getUserCurrency, and getUserLanguage methods
    status: pending
    dependencies:
      - validation
  - id: api-handlers
    content: Create GET and PUT endpoints at /api/v1/me/settings
    status: pending
    dependencies:
      - service
  - id: api-client
    content: Add getMySettings and updateMySettings functions to users API client
    status: pending
    dependencies:
      - api-handlers
  - id: hooks
    content: Create useUserSettings and useUpdateUserSettings hooks
    status: pending
    dependencies:
      - api-client
  - id: ui-component
    content: Create UserSettings component with currency and language selects, add to account page
    status: pending
    dependencies:
      - hooks
  - id: locale-integration
    content: Update LocaleHelpers.getLocale() to use user settings with browser fallback
    status: pending
    dependencies:
      - service
  - id: currency-integration
    content: Update transaction forms and CSV import to use user default currency
    status: pending
    dependencies:
      - hooks
  - id: browser-helpers
    content: Create browser-defaults.ts utility for detecting browser currency and language
    status: pending
---

# User Settings System

## Overview

Create a `UserSetting` table to store user preferences (`defaultCurrency` and `defaultLanguage`). Add UI in the account page to manage these settings, and integrate them throughout the app with browser fallback support.

## Architecture

```javascript
UserSetting (1-to-1 with User)
├── defaultCurrency (nullable, falls back to browser/system)
├── defaultLanguage (nullable, falls back to browser/system)
└── userId (foreign key to User)
```



## Implementation Steps

### 1. Database Schema & Migration

**File: `prisma/schema.prisma`**

- Add `UserSetting` model with:
- `id` (String, @id, @default(cuid()))
- `userId` (String, @unique, foreign key to User)
- `defaultCurrency` (String?, nullable)
- `defaultLanguage` (String?, nullable)
- `createdAt` and `updatedAt` timestamps
- Relation to User model
- Add `userSetting` relation to User model

**File: `prisma/migrations/[timestamp]_add_user_setting/migration.sql`**

- Create UserSetting table
- Add foreign key constraint to User
- Add unique constraint on userId

### 2. Validation Schemas

**File: `src/features/shared/validation/schemas.ts`**

- Add `UserSettingSchema` (Zod schema for UserSetting)
- Add `UpdateUserSettingInputSchema` with:
- `defaultCurrency`: CurrencySchema.optional()
- `defaultLanguage`: z.string().optional()
- Add `IUserSetting` and `IUpdateUserSettingInput` types

### 3. Service Layer

**File: `src/features/users/services/user-setting.service.ts`** (new)

- `getUserSetting(userId: string)`: Get user settings or null
- `upsertUserSetting(userId: string, data: IUpdateUserSettingInput)`: Create or update settings
- `getUserCurrency(userId: string)`: Get currency with fallback (user setting → browser → "USD")
- `getUserLanguage(userId: string)`: Get language with fallback (user setting → browser → "en")

### 4. API Endpoints

**File: `src/features/users/api/handlers/me-settings.ts`** (new)

- `GET /api/v1/me/settings`: Get current user's settings
- `PUT /api/v1/me/settings`: Update user settings
- Use `withAuth` to get userId
- Return UserSettingSchema or null

**File: `src/features/users/api/client.ts`**

- Add `getMySettings()`: Fetch user settings
- Add `updateMySettings(data: IUpdateUserSettingInput)`: Update settings

### 5. React Hooks

**File: `src/features/users/hooks/useUserSettings.ts`** (new)

- `useUserSettings()`: Query hook for user settings
- `useUpdateUserSettings()`: Mutation hook to update settings
- Use query keys from `src/features/shared/query/keys.ts`

**File: `src/features/shared/query/keys.ts`**

- Add `mySettings: () => ["me", "settings"]`

### 6. UI Component

**File: `src/features/users/components/user-settings.tsx`** (new)

- Component similar to `ProfileInformation` structure
- Form with:
- Currency select dropdown (using `CurrencySelect` component)
- Language select dropdown (with common languages: en, nl-NL, etc.)
- Show current values or "Browser default" when not set
- Edit/Save/Cancel functionality
- Unsaved changes dialog

**File: `src/routes/(app)/account.tsx`**

- Import and add `<UserSettings />` component
- Place after `<ProfileInformation />` or in a logical order

### 7. Integration Points

**File: `src/features/util/locale.helpers.ts`**

- Update `getLocale()` to accept optional userId
- Add `getUserLocale(userId?: string)`: Returns user setting → browser → default
- Keep existing `getLocale()` for backward compatibility (browser fallback)

**File: `src/features/currency/utils/currencyhelpers.ts`**

- Update `formatCurrency()` to optionally accept userId
- Use user's default currency when formatting if available

**File: `src/features/transaction/components/expense/add-or-create-expense-dialog.tsx`**

- Replace hardcoded `"EUR"` default with user setting
- Use `useUserSettings()` hook to get default currency
- Fallback to "EUR" if no setting exists

**File: `src/features/transaction/components/income/add-or-create-income-dialog.tsx`**

- Same as expense dialog - use user setting for default currency

**File: `src/features/transaction/components/transaction-import/steps/transaction-import-context.tsx`**

- Replace hardcoded `defaultCurrency: "EUR"` with user setting
- Use `useUserSettings()` hook
- Fallback to "EUR" if no setting exists

**File: `src/features/currency/components/currency-select.tsx`**

- Optionally accept `defaultValue` prop
- Use user setting as default when creating new transactions

### 8. Browser Fallback Helpers

**File: `src/features/users/utils/browser-defaults.ts`** (new)

- `getBrowserCurrency()`: Detect currency from browser locale (e.g., "USD" for en-US, "EUR" for nl-NL)
- `getBrowserLanguage()`: Get browser language (navigator.language)
- Map common locales to currencies

## Data Flow

```javascript
User opens Account page
  → useUserSettings() fetches settings
  → UserSettings component displays current values
  → User edits and saves
  → PUT /api/v1/me/settings updates database
  → Query invalidated, UI updates

Transaction creation
  → useUserSettings() gets default currency
  → Form pre-fills with user's currency
  → Falls back to browser/system if not set

CSV Import
  → useUserSettings() gets default currency
  → Pre-fills import form
  → Falls back to "EUR" if not set

Locale formatting
  → getUserLocale(userId) checks user setting
  → Falls back to browser locale
  → Falls back to "en" or "nl-NL"
```



## Key Considerations

1. **Nullable fields**: Settings are optional - only stored when user explicitly sets them
2. **Fallback chain**: User setting → Browser → System default
3. **Validation**: Currency must be from SUPPORTED_CURRENCIES, Language should be valid locale string
4. **Performance**: Cache user settings in React Query, invalidate on update
5. **Backward compatibility**: Existing code using browser defaults continues to work

## Testing Checklist

- [ ] User can view settings in account page
- [ ] User can set default currency
- [ ] User can set default language
- [ ] User can clear settings (set to null)
- [ ] Transaction forms use user's default currency
- [ ] CSV import uses user's default currency
- [ ] Locale helpers use user's default language
- [ ] Fallbacks work when settings are not set