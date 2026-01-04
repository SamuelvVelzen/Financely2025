import {
  getCurrencyOptions,
  type ICurrency,
} from "@/features/currency/config/currencies";
import {
  SelectDropdown,
  type ISelectDropdownProps,
} from "@/features/ui/select-dropdown/select-dropdown";
import { ISelectOption } from "@/features/ui/select/select";
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

const currencyOptions: ISelectOption[] = getCurrencyOptions();

type ICurrencySelectProps = Omit<
  ISelectDropdownProps,
  "options" | "children" | "placeholder"
> &
  IPropsWithClassName;

export function CurrencySelect({ className, ...props }: ICurrencySelectProps) {
  return (
    <SelectDropdown
      {...(props as ISelectDropdownProps)}
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
              className="size-4"
              aria-hidden="true"
            />
            <span className="">{option.label}</span>
          </span>
        );
      }}
    </SelectDropdown>
  );
}
