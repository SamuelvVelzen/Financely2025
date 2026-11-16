import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";

type ICurrencyProps = {
  amount: string;
  currency: string;
  searchQuery?: string;
  className?: string;
  type?: "EXPENSE" | "INCOME" | "TRANSFER";
  transferDirection?: "OUT" | "IN" | null;
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
  type,
  transferDirection,
}: ICurrencyProps) {
  const { highlightText } = useHighlightText();
  const typedAmount =
    type === "EXPENSE" || (type === "TRANSFER" && transferDirection === "OUT")
      ? `-${amount}`
      : amount;
  const formattedAmount = formatCurrency(typedAmount, currency);

  return (
    <span
      className={cn(
        "tabular-nums text-text",
        type === "INCOME" && "text-income",
        type === "TRANSFER" && "text-text-muted",
        className,
      )}>
      {highlightText(formattedAmount, searchQuery)}
    </span>
  );
}
