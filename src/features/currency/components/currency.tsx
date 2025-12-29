import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";

type ICurrencyProps = {
  amount: string;
  currency: string;
  searchQuery?: string;
  className?: string;
} & IPropsWithClassName;

/**
 * Currency amount component that formats currency and supports search highlighting
 * Uses tabular-nums for consistent number alignment
 */
export function Currency({
  amount,
  currency,
  searchQuery,
  className,
}: ICurrencyProps) {
  const { highlightText } = useHighlightText();
  const formattedAmount = formatCurrency(amount, currency);

  return (
    <span className={cn("tabular-nums text-text", className)}>
      {searchQuery && searchQuery.trim()
        ? highlightText(formattedAmount, searchQuery)
        : formattedAmount}
    </span>
  );
}
