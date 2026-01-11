import { CurrencySelect } from "@/features/currency/components/currency-select";
import { TagSelectCell } from "@/features/tag/components/tag-select-cell";
import { DateSelectCell } from "@/features/transaction/components/date-select-cell";
import { Button } from "@/features/ui/button/button";
import { LinkButton } from "@/features/ui/button/link-button";
import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { TextInput } from "@/features/ui/input/text-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { SelectableTable } from "@/features/ui/table/selectable-table";
import { TableRow } from "@/features/ui/table/table-row";
import { cn } from "@/features/util/cn";
import { useMemo, useState } from "react";
import { HiExclamationCircle } from "react-icons/hi";
import { CsvRowErrorDialog } from "../csv-row-error-dialog";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

const TRANSACTION_TYPE_OPTIONS = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
] as const;

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
    handleSelectAllValid,
    handleExcludeAllInvalid,
    updateCandidate,
  } = useTransactionImportContext();

  // Calculate total valid transactions across all pages
  const totalValidTransactions = useMemo(() => {
    return candidates.filter((c) => c.status === "valid").length;
  }, [candidates]);

  // Calculate how many valid transactions are already selected
  const selectedValidCount = useMemo(() => {
    return candidates.filter(
      (c) => c.status === "valid" && selectedRows.has(c.rowIndex)
    ).length;
  }, [candidates, selectedRows]);

  // Check if any candidate has errors
  const hasAnyErrors = useMemo(() => {
    return candidates.some((c) => c.errors.length > 0);
  }, [candidates]);

  if (transformMutation.isPending) {
    return <div className="text-center py-8">Processing CSV...</div>;
  }

  if (transformMutation.isError) {
    return (
      <div className="p-3 bg-danger/10 border border-danger rounded-2xl">
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
          {transformResponse?.total || candidates.length} transactions (
          {transformResponse?.totalValid || 0} valid,{" "}
          {transformResponse?.totalInvalid || 0} invalid)
          {selectedRows.size > 0 && (
            <span className="ml-2 font-medium">
              • {selectedRows.size} selected
            </span>
          )}
        </div>
        <div className="flex gap-2 text-white">
          <LinkButton
            size="sm"
            clicked={handleSelectAllValid}
            buttonContent="Select all valid"
          />
          |
          <LinkButton
            size="sm"
            clicked={handleExcludeAllInvalid}
            buttonContent="Exclude invalid"
          />
        </div>
      </div>

      <SelectableTable
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        getRowIndex={(item: (typeof candidates)[0]) => item.rowIndex}
        data={candidates}
        enablePagination={true}
        pageSize={20}
        onSelectAllValid={handleSelectAllValid}
        getItemValidity={(candidate) => candidate.status === "valid"}
        selectAllAlertText={(visibleCount, totalCount) => (
          <>
            All {visibleCount} visible transactions selected. Select all{" "}
            {totalCount} valid transactions?
          </>
        )}
        selectAllAlertButtonText="Select all valid"
        headerCells={[
          <HeaderCell key="status">Status</HeaderCell>,
          <HeaderCell key="date">Date</HeaderCell>,
          <HeaderCell key="name">Name</HeaderCell>,
          <HeaderCell key="amount">Amount</HeaderCell>,
          <HeaderCell key="currency">Currency</HeaderCell>,
          <HeaderCell key="type">Type</HeaderCell>,
          <HeaderCell key="primaryTag">Primary Tag</HeaderCell>,
          <HeaderCell key="tags">Tags</HeaderCell>,
          ...(hasAnyErrors
            ? [<HeaderCell key="errors">Errors</HeaderCell>]
            : []),
        ]}>
        {(paginatedCandidates) => {
          return paginatedCandidates.map((candidate) => {
            return (
              <TableRow
                key={candidate.rowIndex}
                rowIndex={candidate.rowIndex}
                className={cn(
                  "border-t border-border",
                  candidate.status === "invalid" && "bg-danger/5"
                )}>
                <BodyCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs",
                      candidate.status === "valid" &&
                        "bg-success/20 text-success",
                      candidate.status === "invalid" &&
                        "bg-danger/20 text-danger"
                    )}>
                    {candidate.status}
                  </span>
                </BodyCell>
                <BodyCell>
                  <DateSelectCell
                    value={candidate.data.transactionDate}
                    timePrecision={candidate.data.timePrecision || "DateOnly"}
                    onChange={(value, precision) => {
                      updateCandidate(candidate.rowIndex, {
                        transactionDate: value,
                        timePrecision: precision,
                      });
                    }}
                  />
                </BodyCell>
                <BodyCell>
                  <div onClick={(e) => e.stopPropagation()}>
                    <TextInput
                      value={candidate.data.name || ""}
                      onChange={(value) => {
                        updateCandidate(candidate.rowIndex, {
                          name: String(value || ""),
                        });
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                </BodyCell>
                <BodyCell>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DecimalInput
                      value={candidate.data.amount || ""}
                      onValueChange={(normalizedValue) => {
                        updateCandidate(candidate.rowIndex, {
                          amount: normalizedValue,
                        });
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                </BodyCell>
                <BodyCell>
                  <div onClick={(e) => e.stopPropagation()}>
                    <CurrencySelect
                      value={
                        (candidate.data.currency || defaultCurrency) as any
                      }
                      onChange={(value) => {
                        updateCandidate(candidate.rowIndex, {
                          currency: value || defaultCurrency || ("EUR" as any),
                        });
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                </BodyCell>
                <BodyCell>
                  <div onClick={(e) => e.stopPropagation()}>
                    <SelectDropdown
                      options={TRANSACTION_TYPE_OPTIONS}
                      value={candidate.data.type || undefined}
                      onChange={(value) => {
                        updateCandidate(candidate.rowIndex, {
                          type: value as any,
                        });
                      }}
                      placeholder="Select type"
                      className="h-8 text-sm"
                      showClearButton={false}
                    />
                  </div>
                </BodyCell>
                <BodyCell>
                  {(() => {
                    // Convert primaryTagMetadata to array format expected by TagSelectCell
                    const tagMetadata = candidate.primaryTagMetadata
                      ? [candidate.primaryTagMetadata]
                      : [];

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <TagSelectCell
                          tagMetadata={tagMetadata}
                          transactionType={candidate.data.type}
                          value={candidate.data.primaryTagId ?? undefined}
                          onChange={(value) => {
                            updateCandidate(candidate.rowIndex, {
                              primaryTagId: (value as string) || null,
                            });
                          }}
                          multiple={false}
                          placeholder="Select primary tag..."
                        />
                      </div>
                    );
                  })()}
                </BodyCell>
                <BodyCell>
                  {(() => {
                    // tagsMetadata is already in the correct array format
                    const tagMetadata = candidate.tagsMetadata;

                    const { tagIds, primaryTagId } = candidate.data;

                    // Filter out primary tag from other tags
                    const otherTagIds = tagIds.filter(
                      (tagId) => tagId !== primaryTagId
                    );

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <TagSelectCell
                          tagMetadata={tagMetadata}
                          transactionType={candidate.data.type}
                          value={
                            otherTagIds.length > 0 ? otherTagIds : undefined
                          }
                          onChange={(value) => {
                            // Update other tags (don't include primary tag)
                            const newTagIds = Array.isArray(value) ? value : [];
                            updateCandidate(candidate.rowIndex, {
                              tagIds: newTagIds,
                            });
                          }}
                          multiple={true}
                          placeholder="Select tags..."
                        />
                      </div>
                    );
                  })()}
                </BodyCell>
                {hasAnyErrors && (
                  <BodyCell>
                    {candidate.errors.length > 0 ? (
                      <Button
                        clicked={(e) => {
                          e?.stopPropagation();
                          setErrorDialogRowIndex(candidate.rowIndex);
                        }}
                        buttonContent={
                          <div className="flex items-center gap-2">
                            <HiExclamationCircle className="size-4 text-danger" />
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
                )}
              </TableRow>
            );
          });
        }}
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
        buttonContent: `Continue to import ${ctx.selectedRows.size} transaction${ctx.selectedRows.size !== 1 ? "s" : ""}`,
      },
    ],
  };
}
