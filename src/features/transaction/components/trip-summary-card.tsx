import { Currency } from "@/features/currency/components/currency";
import { apiGet } from "@/features/shared/api/client";
import { useFinQuery } from "@/features/shared/query/core";
import type { ITripSummary } from "@/features/shared/validation/schemas";
import { workspaceApiV1Path } from "@/features/workspace/workspace-api-path";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";

type ITripSummaryCardProps = {
  tagIds: string[];
  from?: string;
  to?: string;
};

export function TripSummaryCard({ tagIds, from, to }: ITripSummaryCardProps) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null && tagIds.length > 0;
  const { data } = useFinQuery<ITripSummary, Error>({
    queryKey: ["trip-summary", workspaceId, tagIds, from, to],
    enabled,
    queryFn: async () => {
      if (workspaceId == null) throw new Error("Workspace required");
      const params = new URLSearchParams();
      for (const id of tagIds) params.append("tagIds", id);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return apiGet<ITripSummary>(
        `${workspaceApiV1Path(workspaceId, "trip-summary")}${suffix}`,
      );
    },
  });

  if (!enabled || !data) return null;

  return (
    <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-4 md:grid-cols-4">
      <SummaryLine label="Funded" amount={data.funded} currency={data.currency} />
      <SummaryLine label="Withdrawn" amount={data.withdrawn} currency={data.currency} />
      <SummaryLine label="Spent" amount={data.spent} currency={data.currency} />
      <SummaryLine label="Cash left" amount={data.cashLeft} currency={data.currency} />
    </div>
  );
}

function SummaryLine({
  label,
  amount,
  currency,
}: {
  label: string;
  amount: string;
  currency: string;
}) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <Currency amount={amount} currency={currency} className="font-semibold" />
    </div>
  );
}
