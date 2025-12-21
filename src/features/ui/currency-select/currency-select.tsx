"use client";

import {
  getCurrencyOptions,
  type ICurrency,
} from "@/features/shared/validation/schemas";
import { cn } from "@/features/util/cn";
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
import {
  SelectDropdown,
  type ISelectDropdownProps,
} from "../select-dropdown/select-dropdown";

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
  IPropsWithClassName & {
    disabled?: boolean;
  };

export function CurrencySelect({
  className,
  disabled = false,
  ...props
}: ICurrencySelectProps) {
  return (
    <div
      className={cn(disabled && "opacity-60 pointer-events-none")}
      aria-disabled={disabled}>
      <SelectDropdown
        {...props}
        className={className}
        options={currencyOptions}
        placeholder="Select currency"
        showClearButton={false}>
        {(option) => {
          const Icon =
            CURRENCY_ICONS[option.value as ICurrency] ??
            PiCurrencyDollarDuotone;

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
    </div>
  );
}
