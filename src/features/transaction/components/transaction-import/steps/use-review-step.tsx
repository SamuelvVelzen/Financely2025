import { Button } from "@/features/ui/button/button";
import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { Pagination, usePagination } from "@/features/ui/pagination";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { SelectableTable } from "@/features/ui/table/selectable-table";
import { TableRow } from "@/features/ui/table/table-row";
import { cn } from "@/util/cn";
import { DateFormatHelpers } from "@/util/date/date-format.helpers";
import { useState } from "react";
import { HiExclamationCircle } from "react-icons/hi";
import { CsvRowErrorDialog } from "../csv-row-error-dialog";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

function ReviewStepContent({
  errorDialogRowIndex,
  setErrorDialogRowIndex,
}: {
  errorDialogRowIndex: number | null;
  setErrorDialogRowIndex: (index: number | null) => void;
}) {
  const {
    transformMutation,
    candidates,
    transformResponse,
    selectedRows,
    setSelectedRows,
    defaultCurrency,
    currentPage,
    setCurrentPage,
    handleSelectAllValid,
    handleExcludeAllInvalid,
  } = useTransactionImportContext();

  // Use the pagination hook for client-side pagination
  const pagination = usePagination({
    totalItems: candidates.length,
    pageSize: 20,
    initialPage: currentPage,
  });

  // Sync pagination state with context (context manages the currentPage state)
  const paginatedCandidates = pagination.paginate(candidates);

  if (transformMutation.isPending) {
    return <div className="text-center py-8">Processing CSV...</div>;
  }

  if (transformMutation.isError) {
    return (
      <div className="p-3 bg-danger/10 border border-danger rounded-lg">
        <p className="text-sm text-danger">
          {transformMutation.error?.message || "Failed to process CSV"}
        </p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return <div className="text-center py-8">No transactions found</div>;
  }

  const errorDialogCandidate =
    errorDialogRowIndex !== null
      ? candidates.find((c) => c.rowIndex === errorDialogRowIndex)
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          Showing {paginatedCandidates.length} of{" "}
          {transformResponse?.total || candidates.length} transactions (
          {transformResponse?.totalValid || 0} valid,{" "}
          {transformResponse?.totalInvalid || 0} invalid)
        </div>
        <div className="flex gap-2">
          <Button
            clicked={handleSelectAllValid}
            buttonContent="Select All Valid"
            className="px-3 py-1 text-sm"
          />
          <Button
            clicked={handleExcludeAllInvalid}
            buttonContent="Exclude Invalid"
            className="px-3 py-1 text-sm"
          />
        </div>
      </div>

      <SelectableTable
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        rowCount={paginatedCandidates.length}
        getRowIndex={(row) => {
          const props = row.props as { rowIndex?: number };
          return props.rowIndex ?? -1;
        }}
        headerCells={[
          <HeaderCell key="status">Status</HeaderCell>,
          <HeaderCell key="date">Date</HeaderCell>,
          <HeaderCell key="name">Name</HeaderCell>,
          <HeaderCell key="amount">Amount</HeaderCell>,
          <HeaderCell key="currency">Currency</HeaderCell>,
          <HeaderCell key="type">Type</HeaderCell>,
          <HeaderCell key="errors">Errors</HeaderCell>,
        ]}
      >
        {paginatedCandidates.map((candidate) => {
          return (
            <TableRow
              key={candidate.rowIndex}
              rowIndex={candidate.rowIndex}
              className={cn(
                "border-t border-border",
                candidate.status === "invalid" && "bg-danger/5"
              )}
            >
              <BodyCell>
                <span
                  className={cn(
                    "px-2 py-1 rounded text-xs",
                    candidate.status === "valid" &&
                      "bg-success/20 text-success",
                    candidate.status === "invalid" && "bg-danger/20 text-danger"
                  )}
                >
                  {candidate.status}
                </span>
              </BodyCell>
              <BodyCell>
                <span className="text-sm text-text-muted">
                  {candidate.data.occurredAt
                    ? DateFormatHelpers.formatIsoStringToString(
                        candidate.data.occurredAt
                      )
                    : "—"}
                </span>
              </BodyCell>
              <BodyCell>
                <span className="text-sm text-text">
                  {candidate.data.name || "—"}
                </span>
              </BodyCell>
              <BodyCell>
                <span className="text-sm text-text">
                  {candidate.data.amount || "—"}
                </span>
              </BodyCell>
              <BodyCell>
                <span className="text-sm font-medium">
                  {candidate.data.currency || defaultCurrency}
                </span>
              </BodyCell>
              <BodyCell>
                <span className="text-sm font-medium">
                  {candidate.data.type || "—"}
                </span>
              </BodyCell>
              <BodyCell>
                {candidate.errors.length > 0 ? (
                  <Button
                    clicked={() => setErrorDialogRowIndex(candidate.rowIndex)}
                    buttonContent={
                      <div className="flex items-center gap-2">
                        <HiExclamationCircle className="w-4 h-4 text-danger" />
                        <span className="text-sm text-danger">
                          {candidate.errors.length} error
                          {candidate.errors.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    }
                    className="px-2 py-1 text-sm border-0 bg-transparent hover:bg-danger/10"
                    variant="default"
                  />
                ) : (
                  <span className="text-sm text-text-muted">—</span>
                )}
              </BodyCell>
            </TableRow>
          );
        })}
      </SelectableTable>

      <CsvRowErrorDialog
        candidate={errorDialogCandidate ?? null}
        open={errorDialogRowIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setErrorDialogRowIndex(null);
          }
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export function useReviewStep(): IStepConfig<IStep> {
  const ctx = useTransactionImportContext();

  // Step-local state (only UI state, not data-fetching state)
  const [errorDialogRowIndex, setErrorDialogRowIndex] = useState<number | null>(
    null
  );

  return {
    title: "Review Transactions",
    size: "full",
    content: () => (
      <ReviewStepContent
        errorDialogRowIndex={errorDialogRowIndex}
        setErrorDialogRowIndex={setErrorDialogRowIndex}
      />
    ),
    footerButtons: (navigation: IStepNavigation<IStep>) => [
      {
        clicked: () => navigation.goToStep("mapping"),
        buttonContent: "Back",
      },
      {
        clicked: () => {
          if (ctx.selectedRows.size > 0) {
            navigation.goToStep("confirm");
          }
        },
        variant: "primary",
        disabled: ctx.selectedRows.size === 0,
        buttonContent: "Continue to Import",
      },
    ],
  };
}
