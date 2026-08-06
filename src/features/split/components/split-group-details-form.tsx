import { CurrencySelect } from "@/features/currency/components/currency-select";
import type { ISplitGroupFormValues } from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { TextInput } from "@/features/ui/input/text-input";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useState } from "react";

export interface ISplitGroupDetailsFormProps {
  formId: string;
  initialValues: ISplitGroupFormValues;
  canChangeCurrency: boolean;
  isEditMode: boolean;
  disabled?: boolean;
  /** Extra hint under balance currency (create wizard). */
  currencyHint?: string;
  onSubmit: (values: ISplitGroupFormValues) => void;
  onValuesChange?: (values: ISplitGroupFormValues) => void;
}

export function SplitGroupDetailsForm({
  formId,
  initialValues,
  canChangeCurrency,
  isEditMode,
  disabled,
  currencyHint,
  onSubmit,
  onValuesChange,
}: ISplitGroupDetailsFormProps) {
  const workspaceId = useNavWorkspaceId();
  const [name, setName] = useState(initialValues.name);
  const [currency, setCurrency] = useState(initialValues.defaultCurrency);

  const trimmedName = name.trim();
  const hasChanges =
    trimmedName !== initialValues.name.trim() ||
    (canChangeCurrency && currency !== initialValues.defaultCurrency);
  const canSubmit = isEditMode
    ? trimmedName.length > 0 && hasChanges && !disabled
    : trimmedName.length > 0 && !disabled;

  const emitChange = (nextName: string, nextCurrency: string) => {
    onValuesChange?.({
      name: nextName.trim(),
      defaultCurrency: nextCurrency,
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onSubmit({ name: trimmedName, defaultCurrency: currency });
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="space-y-4 p-4">
      <TextInput
        label="Group name"
        value={name}
        onChange={(v) => {
          const next = String(v ?? "");
          setName(next);
          emitChange(next, currency);
        }}
        placeholder="Barcelona trip"
        disabled={disabled}
      />
      <CurrencySelect
        label="Balance currency"
        value={currency}
        onChange={(v) => {
          if (typeof v === "string") {
            setCurrency(v);
            emitChange(name, v);
          }
        }}
        workspaceId={workspaceId}
        disabled={!canChangeCurrency || disabled}
        hint={
          currencyHint ??
          (canChangeCurrency
            ? "Used to settle balances between members"
            : "Currency cannot be changed after the first expense")
        }
      />
      <button
        type="submit"
        className="sr-only"
        disabled={!canSubmit}>
        Submit
      </button>
    </form>
  );
}
