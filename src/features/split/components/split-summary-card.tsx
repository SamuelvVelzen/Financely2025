import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { useSplitSummary } from "@/features/split/hooks/use-split-groups";
import { Container } from "@/features/ui/container/container";
import { Skeleton } from "@/features/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { HiUsers } from "react-icons/hi2";

export function SplitSummaryCard() {
  const { data, isLoading } = useSplitSummary();

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-2xl" />;
  }

  const groups = data?.groups ?? [];
  if (groups.length === 0) {
    return null;
  }

  const totalOwed = groups.reduce(
    (sum, g) => sum + Math.min(0, parseFloat(g.netAmount)),
    0,
  );
  const totalOwedToYou = groups.reduce(
    (sum, g) => sum + Math.max(0, parseFloat(g.netAmount)),
    0,
  );

  return (
    <Container className="border border-border rounded-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
            <HiUsers className="size-4" />
            Shared expenses
          </div>
          {totalOwed < -0.005 ? (
            <p className="text-lg font-semibold text-danger">
              You owe {formatCurrency(Math.abs(totalOwed).toFixed(2), groups[0]!.currency)} across {groups.length} groups
            </p>
          ) : totalOwedToYou > 0.005 ? (
            <p className="text-lg font-semibold text-success">
              You are owed {formatCurrency(totalOwedToYou.toFixed(2), groups[0]!.currency)}
            </p>
          ) : (
            <p className="text-lg font-semibold text-text">All settled in splits</p>
          )}
        </div>
        <Link to="/splits" className="text-sm text-primary shrink-0">
          View splits
        </Link>
      </div>
    </Container>
  );
}
