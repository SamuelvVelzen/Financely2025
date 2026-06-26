import {
  buildCurrencySelectOptions,
  getCurrencySearchValue,
  type ICurrency,
} from "@/features/currency/config/currencies";
import { useLastUsedCurrencies } from "@/features/currency/hooks/useLastUsedCurrencies";
import { useWorkspaceCurrencies } from "@/features/currency/hooks/useWorkspaceCurrencies";
import { type IFormOrControlledMode } from "@/features/shared/hooks/use-form-context-optional";
import { Select, type ISelectProps } from "@/features/ui/select/select";
import { useDefaultCurrency } from "@/features/workspace/hooks/useWorkspaceSettings";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { getBrowserCurrency } from "@/features/users/utils/browser-defaults";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useMemo } from "react";

type ICurrencySelectProps = IPropsWithClassName &
  Omit<
    ISelectProps<ICurrency>,
    | "options"
    | "children"
    | "placeholder"
    | "getOptionSearchValue"
    | "name"
    | "value"
    | "onChange"
  > &
  IFormOrControlledMode<ICurrency | ICurrency[]> & {
    workspaceId?: IWorkspaceId | null;
    clearable?: boolean;
  };

export function CurrencySelect({
  className,
  workspaceId = null,
  name,
  value,
  onValueChange,
  onChange,
  ...props
}: ICurrencySelectProps) {
  const workspaceDefault = useDefaultCurrency(workspaceId ?? null);
  const { data: workspaceCurrencies = [] } = useWorkspaceCurrencies(workspaceId);
  const { lastUsed, recordCurrencyUse } = useLastUsedCurrencies();
  const browserCurrency = getBrowserCurrency();

  const { options } = useMemo(
    () =>
      buildCurrencySelectOptions({
        workspaceDefault,
        browserCurrency,
        lastUsed,
        workspaceCurrencies,
      }),
    [workspaceDefault, browserCurrency, lastUsed, workspaceCurrencies],
  );

  const handleValueChange = (nextValue: ICurrency | ICurrency[] | undefined) => {
    if (!Array.isArray(nextValue) && nextValue) {
      recordCurrencyUse(nextValue);
    }
    onValueChange?.(nextValue);
  };

  const handleChange = (nextValue: ICurrency | ICurrency[] | undefined) => {
    if (!Array.isArray(nextValue) && nextValue) {
      recordCurrencyUse(nextValue);
    }
    onChange?.(nextValue);
  };

  const sharedProps = {
    ...props,
    className,
    options,
    placeholder: "Select currency",
    getOptionSearchValue: getCurrencySearchValue,
    dropdownPanelClassName:
      "w-max min-w-[max(100%,18rem)] max-w-[min(calc(100vw-2rem),28rem)]",
    onValueChange: handleValueChange,
  };

  const selectProps = name
    ? { ...sharedProps, name }
    : { ...sharedProps, value: value!, onChange: handleChange };

  return (
    <Select<ICurrency> {...selectProps}>
      {(option) => (
        <span className="truncate min-w-0">{option.label}</span>
      )}
    </Select>
  );
}
