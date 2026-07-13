import { CurrencySelect } from "@/features/currency/components/currency-select";
import { getSplitExpenseRecommendedCurrencies } from "@/features/split/utils/split-expense-currencies";
import type { ISplitExpenseFormValues } from "@/features/split/utils/split-expense-form-values";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
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

export function SplitExpenseForm({
  formId,
  initialValues,
  groupCurrency,
  expenses,
  members,
  disabled,
  onSubmit,
}: {
  formId: string;
  initialValues: ISplitExpenseFormValues;
  groupCurrency: string;
  expenses: ISplitExpense[];
  members: IMember[];
  disabled?: boolean;
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

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void onSubmit({
      description,
      amount,
      currency,
      expenseDate,
      paidByMemberId,
      participantMemberIds: participantIds,
    });
  };

  const canSubmit =
    description.trim().length > 0 &&
    amount.trim().length > 0 &&
    participantIds.length > 0 &&
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
      <div>
        <p className="text-sm font-medium text-text mb-2">Split between</p>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id}>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={participantIds.includes(m.id)}
                  onChange={() => toggleParticipant(m.id)}
                  disabled={disabled}
                />
                {m.displayName}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <button type="submit" className="sr-only" disabled={!canSubmit}>
        Submit
      </button>
    </form>
  );
}
