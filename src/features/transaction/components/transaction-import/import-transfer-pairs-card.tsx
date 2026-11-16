import {
  applyCsvTransferPair,
  findCsvTransferPairSuggestions,
} from "@/features/transaction/utils/find-csv-transfer-pair-suggestions";
import { Button } from "@/features/ui/button/button";
import { useMemo } from "react";
import { HiArrowsRightLeft } from "react-icons/hi2";
import { useTransactionImportContext } from "./steps/transaction-import-context";

export function ImportTransferPairsCard() {
  const { candidates, updateCandidate } = useTransactionImportContext();

  const suggestions = useMemo(
    () => findCsvTransferPairSuggestions(candidates),
    [candidates],
  );

  if (suggestions.length === 0) {
    return null;
  }

  const applyPair = (outRowIndex: number, inRowIndex: number) => {
    const outCandidate = candidates.find((c) => c.rowIndex === outRowIndex);
    const inCandidate = candidates.find((c) => c.rowIndex === inRowIndex);
    if (!outCandidate || !inCandidate) return;

    const transferGroupId = crypto.randomUUID();
    const { out, in: inUpdates } = applyCsvTransferPair(
      outCandidate,
      inCandidate,
      transferGroupId,
    );

    updateCandidate(outRowIndex, out);
    updateCandidate(inRowIndex, inUpdates);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-secondary/40 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <HiArrowsRightLeft className="size-4" />
        Suggested transfer pairs ({suggestions.length})
      </div>
      <p className="text-xs text-text-muted">
        Same amount and currency within ±3 days. Applying marks both rows as
        transfer legs and imports them as one linked move.
      </p>
      <ul className="space-y-2">
        {suggestions.map((pair) => (
          <li
            key={`${pair.outRowIndex}-${pair.inRowIndex}`}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span className="min-w-0 flex-1">{pair.label}</span>
            <Button
              size="sm"
              variant="default"
              clicked={() => applyPair(pair.outRowIndex, pair.inRowIndex)}
            >
              Apply as transfer
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
