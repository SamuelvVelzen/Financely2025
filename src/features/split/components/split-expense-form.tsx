import { CurrencySelect } from "@/features/currency/components/currency-select";
import { getCurrencyMinorUnits } from "@/features/currency/config/currencies";
import { SplitExpenseSplitSection } from "@/features/split/components/split-expense-split-section";
import { getSplitExpenseRecommendedCurrencies } from "@/features/split/utils/split-expense-currencies";
import type { ISplitExpenseFormValues } from "@/features/split/utils/split-expense-form-values";
import type { ISplitMode } from "@/features/split/utils/split-mode";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { Checkbox } from "@/features/ui/checkbox/checkbox";
import { DateInput } from "@/features/ui/input/date-input";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { TextInput } from "@/features/ui/input/text-input";
import { Select } from "@/features/ui/select/select";
import {
  dateOnlyToIso,
  isoToDateOnly,
} from "@/features/util/date/dateisohelpers";
import { parseISO } from "date-fns";
import { useMemo, useState } from "react";

type IMember = { id: string; displayName: string };

function parseSum(values: string[]): number {
  return values.reduce((acc, value) => {
    const parsed = parseFloat(value);
    return acc + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
}

function canSubmitSplit(
  amount: string,
  currency: string,
  participantIds: string[],
  splitMode: ISplitMode,
  shareInputs: Record<string, string>,
): boolean {
  if (participantIds.length === 0) {
    return false;
  }
  if (splitMode === "equal") {
    return true;
  }

  const inputs = participantIds.map((id) => shareInputs[id]?.trim() ?? "");
  if (inputs.some((value) => value.length === 0)) {
    return false;
  }

  const sum = parseSum(inputs);
  if (splitMode === "exact") {
    const total = parseFloat(amount);
    if (!Number.isFinite(total)) {
      return false;
    }
    const minor = getCurrencyMinorUnits(currency);
    const factor = 10 ** minor;
    return Math.round(sum * factor) === Math.round(total * factor);
  }
  if (splitMode === "percent") {
    return Math.round(sum * 100) === 10000;
  }
  return sum > 0;
}

export function SplitExpenseForm({
  formId,
  initialValues,
  groupCurrency,
  expenses,
  members,
  disabled,
  showAddToTransactions = false,
  onSubmit,
}: {
  formId: string;
  initialValues: ISplitExpenseFormValues;
  groupCurrency: string;
  expenses: ISplitExpense[];
  members: IMember[];
  disabled?: boolean;
  showAddToTransactions?: boolean;
  onSubmit: (values: ISplitExpenseFormValues) => void | Promise<void>;
}) {
  const [description, setDescription] = useState(initialValues.description);
  const [amount, setAmount] = useState(initialValues.amount);
  const [currency, setCurrency] = useState(initialValues.currency);
  const [expenseDate, setExpenseDate] = useState(initialValues.expenseDate);
  const [paidByMemberId, setPaidByMemberId] = useState(initialValues.paidByMemberId);
  const [participantIds, setParticipantIds] = useState(
    initialValues.participantMemberIds,
  );
  const [splitMode, setSplitMode] = useState<ISplitMode>(initialValues.splitMode);
  const [shareInputs, setShareInputs] = useState(initialValues.shareInputs);
  const [addToTransactions, setAddToTransactions] = useState(
    initialValues.addToTransactions,
  );
  const [hasTime, setHasTime] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const recommendedCurrencies = useMemo(
    () => getSplitExpenseRecommendedCurrencies(groupCurrency, expenses),
    [groupCurrency, expenses],
  );

  const handleToggleTime = () => {
    if (!expenseDate) {
      return;
    }

    try {
      if (hasTime) {
        setExpenseDate(dateOnlyToIso(isoToDateOnly(expenseDate)));
        setHasTime(false);
        return;
      }

      const currentDate = parseISO(expenseDate);
      const updatedDate = new Date(currentDate);
      const now = new Date();
      updatedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
      setExpenseDate(updatedDate.toISOString());
      setHasTime(true);
      setDatePickerOpen(true);
    } catch {
      // Keep current value if parsing fails.
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      description.trim().length === 0 ||
      amount.trim().length === 0 ||
      !canSubmitSplit(amount, currency, participantIds, splitMode, shareInputs)
    ) {
      return;
    }
    void onSubmit({
      description,
      amount,
      currency,
      expenseDate,
      paidByMemberId,
      participantMemberIds: participantIds,
      splitMode,
      shareInputs,
      addToTransactions,
    });
  };

  const canSubmit =
    description.trim().length > 0 &&
    amount.trim().length > 0 &&
    canSubmitSplit(amount, currency, participantIds, splitMode, shareInputs) &&
    !disabled;

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
      <TextInput
        label="Description"
        value={description}
        onChange={(v) => setDescription(String(v ?? ""))}
        placeholder="Dinner"
        disabled={disabled}
      />
      <div className="flex gap-2 items-end">
        <DecimalInput
          label="Amount"
          value={amount}
          onChange={(v) => setAmount(String(v ?? ""))}
          currency={currency}
          className="flex-1 min-w-0"
          disabled={disabled}
        />
        <CurrencySelect
          label="Currency"
          value={currency}
          onChange={(v) => {
            if (typeof v === "string") {
              setCurrency(v);
            }
          }}
          recommendedCurrencies={recommendedCurrencies}
          className="w-36 shrink-0"
          disabled={disabled}
        />
      </div>
      <DateInput
        label={hasTime ? "Date & Time" : "Date"}
        mode={hasTime ? "dateTime" : "dateOnly"}
        value={expenseDate}
        onChange={(v) => {
          if (typeof v === "string") {
            setExpenseDate(v);
          }
        }}
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        onAddTime={handleToggleTime}
        onRemoveTime={handleToggleTime}
        disabled={disabled}
      />
      <Select
        label="Paid by"
        value={paidByMemberId}
        onChange={(v) =>
          setPaidByMemberId(typeof v === "string" ? v : paidByMemberId)
        }
        options={members.map((m) => ({ value: m.id, label: m.displayName }))}
        disabled={disabled}
      />
      <SplitExpenseSplitSection
        members={members}
        amount={amount}
        currency={currency}
        paidByMemberId={paidByMemberId}
        participantIds={participantIds}
        splitMode={splitMode}
        shareInputs={shareInputs}
        disabled={disabled}
        onParticipantIdsChange={setParticipantIds}
        onSplitModeChange={setSplitMode}
        onShareInputsChange={setShareInputs}
      />
      {showAddToTransactions ? (
        <Checkbox
          label="Add to my personal transactions"
          hint="Only adds this for you. Other members can opt in from the expense."
          checked={addToTransactions}
          onChange={(event) => setAddToTransactions(event.target.checked)}
          disabled={disabled}
        />
      ) : null}
      <button type="submit" className="sr-only" disabled={!canSubmit}>
        Submit
      </button>
    </form>
  );
}
