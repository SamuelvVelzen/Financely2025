import { useLedgerAccounts } from "@/features/ledger-account/hooks/useLedgerAccounts";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { useMemo } from "react";

type ILedgerAccountSelectProps = {
  name: string;
  label?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
};

export function LedgerAccountSelect({
  name,
  label = "Account",
  disabled,
  allowEmpty = true,
}: ILedgerAccountSelectProps) {
  const { data } = useLedgerAccounts();
  const options = useMemo(() => {
    const rows = data?.data ?? [];
    const base = rows.map((account) => ({
      value: account.id,
      label: `${account.name} (${account.kind})`,
    }));
    if (allowEmpty) {
      return [{ value: "", label: "Unassigned" }, ...base];
    }
    return base;
  }, [allowEmpty, data?.data]);

  return (
    <SelectDropdown
      name={name}
      label={label}
      options={options}
      placeholder="Select account..."
      disabled={disabled}
    />
  );
}
