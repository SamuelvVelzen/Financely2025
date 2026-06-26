import {
  buildCurrencySelectOptions,
  getCurrencySearchValue,
  type ICurrency,
} from "@/features/currency/config/currencies";
import { useLastUsedCurrencies } from "@/features/currency/hooks/useLastUsedCurrencies";
import { useWorkspaceCurrencies } from "@/features/currency/hooks/useWorkspaceCurrencies";
import { Select, type ISelectProps } from "@/features/ui/select/select";
import { useDefaultCurrency } from "@/features/workspace/hooks/useWorkspaceSettings";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { getBrowserCurrency } from "@/features/users/utils/browser-defaults";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useMemo } from "react";

type ICurrencySelectProps = Omit<
  ISelectProps<ICurrency>,
  "options" | "children" | "placeholder" | "getOptionSearchValue"
> &
  IPropsWithClassName & {
    workspaceId?: IWorkspaceId | null;
    clearable?: boolean;
  };

export function CurrencySelect({
  className,
  workspaceId = null,
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

  const handleValueChange = (value: ICurrency | ICurrency[] | undefined) => {
    if (!Array.isArray(value) && value) {
      recordCurrencyUse(value);
    }
    onValueChange?.(value as ICurrency);
  };

  const handleChange = (value: ICurrency | ICurrency[] | undefined) => {
    if (!Array.isArray(value) && value) {
      recordCurrencyUse(value);
    }
    onChange?.(value);
  };

  return (
    <Select<ICurrency>
      {...props}
      className={className}
      options={options}
      placeholder="Select currency"
      getOptionSearchValue={getCurrencySearchValue}
      dropdownPanelClassName="w-max min-w-[max(100%,18rem)] max-w-[min(calc(100vw-2rem),28rem)]"
      onValueChange={handleValueChange}
      onChange={handleChange}>
      {(option) => (
        <span className="truncate min-w-0">{option.label}</span>
      )}
    </Select>
  );
}
