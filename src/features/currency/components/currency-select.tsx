import {
  getCurrencyOptions,
  type ICurrency,
} from "@/features/currency/config/currencies";
import {
  SelectDropdown,
  type ISelectDropdownProps,
} from "@/features/ui/select-dropdown/select-dropdown";
import { type ISelectOption } from "@/features/ui/select/select";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { type IconType } from "react-icons";
import {
  PiCurrencyCircleDollar,
  PiCurrencyCny,
  PiCurrencyDollar,
  PiCurrencyDollarSimple,
  PiCurrencyEur,
  PiCurrencyGbp,
} from "react-icons/pi";

const CURRENCY_ICONS: Partial<Record<ICurrency, IconType>> = {
  USD: PiCurrencyDollar,
  EUR: PiCurrencyEur,
  GBP: PiCurrencyGbp,
  CAD: PiCurrencyDollarSimple,
  AUD: PiCurrencyCircleDollar,
  JPY: PiCurrencyCny,
};

const currencyOptions: ISelectOption[] = getCurrencyOptions();

type ICurrencySelectProps = Omit<
  ISelectDropdownProps,
  "options" | "children" | "placeholder"
> &
  IPropsWithClassName & {
    clearable?: boolean;
  };

export function CurrencySelect({
  className,
  clearable = false,
  ...props
}: ICurrencySelectProps) {
  return (
    <SelectDropdown
      {...(props as ISelectDropdownProps)}
      className={className}
      options={currencyOptions}
      placeholder="Select currency"
      clearable={clearable}>
      {(option) => {
        const Icon =
          CURRENCY_ICONS[option.value as ICurrency] ?? PiCurrencyDollar;

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
