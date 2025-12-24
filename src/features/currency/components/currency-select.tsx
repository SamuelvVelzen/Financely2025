"use client";

import {
  getCurrencyOptions,
  type ICurrency,
} from "@/features/currency/config/currencies";
import {
  SelectDropdown,
  type ISelectDropdownProps,
} from "@/features/ui/select-dropdown/select-dropdown";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { type IconType } from "react-icons";
import {
  PiCurrencyCircleDollarDuotone,
  PiCurrencyCnyDuotone,
  PiCurrencyDollarDuotone,
  PiCurrencyDollarSimpleDuotone,
  PiCurrencyEurDuotone,
  PiCurrencyGbpDuotone,
} from "react-icons/pi";

const CURRENCY_ICONS: Partial<Record<ICurrency, IconType>> = {
  USD: PiCurrencyDollarDuotone,
  EUR: PiCurrencyEurDuotone,
  GBP: PiCurrencyGbpDuotone,
  CAD: PiCurrencyDollarSimpleDuotone,
  AUD: PiCurrencyCircleDollarDuotone,
  JPY: PiCurrencyCnyDuotone,
};

const currencyOptions = getCurrencyOptions();

type ICurrencySelectProps = Omit<
  ISelectDropdownProps<typeof currencyOptions>,
  "options" | "children" | "placeholder"
> &
  IPropsWithClassName;

export function CurrencySelect({
  className,

  ...props
}: ICurrencySelectProps) {
  return (
    <SelectDropdown
      {...props}
      className={className}
      options={currencyOptions}
      placeholder="Select currency"
      showClearButton={false}>
      {(option) => {
        const Icon =
          CURRENCY_ICONS[option.value as ICurrency] ?? PiCurrencyDollarDuotone;

        return (
          <span className="flex items-center gap-2 w-full">
            <Icon
              className="w-4 h-4"
              aria-hidden="true"
            />
            <span className="">{option.label}</span>
          </span>
        );
      }}
    </SelectDropdown>
  );
}
