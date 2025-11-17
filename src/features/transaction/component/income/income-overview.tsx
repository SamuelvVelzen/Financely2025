import type { Transaction } from "@/features/shared/validation/schemas";
import { TransactionCsvImportDialog } from "@/features/transaction/component/transaction-csv-import-dialog";
import {
  useDeleteIncome,
  useIncomes,
} from "@/features/transaction/hooks/useTransactions";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Title } from "@/features/ui/typography/title";
import { useState } from "react";
import {
  HiArrowDownTray,
  HiArrowTrendingUp,
  HiPencil,
  HiTrash,
} from "react-icons/hi2";
import { AddOrCreateIncomeDialog } from "./add-or-create-income-dialog";

export function IncomeOverview() {
  const { data, isLoading, error } = useIncomes();
  const incomes = data?.data ?? [];
  const { mutate: deleteIncome } = useDeleteIncome();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Transaction | undefined>(
    undefined
  );

  const handleCreateIncome = () => {
    setSelectedIncome(undefined);
    setIsIncomeDialogOpen(true);
  };

  const handleEditIncome = (income: Transaction) => {
    setSelectedIncome(income);
    setIsIncomeDialogOpen(true);
  };

  const handleDeleteClick = (incomeId: string) => {
    setSelectedIncome(incomes.find((income) => income.id === incomeId));
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedIncome) {
      deleteIncome(selectedIncome.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedIncome(undefined);
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedIncome(undefined);
  };

  // Format amount with currency
  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  // Format date
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Container className="mb-4">
        <Title className="flex items-center justify-between">
          <div className="flex gap-2">
            <HiArrowTrendingUp />

            <span>Incomes</span>
          </div>

          <Dropdown>
            <DropdownItem
              icon={<HiArrowTrendingUp />}
              clicked={() => handleCreateIncome()}>
              Add income
            </DropdownItem>
            <DropdownItem
              icon={<HiArrowDownTray />}
              clicked={() => setIsCsvImportDialogOpen(true)}>
              Import from CSV
            </DropdownItem>
          </Dropdown>
        </Title>
      </Container>

      {isLoading && (
        <Container>
          <p className="text-text-muted text-center">Loading incomes...</p>
        </Container>
      )}

      {error && (
        <Container>
          <p className="text-red-500 text-center">
            Error loading incomes: {error.message}
          </p>
        </Container>
      )}

      {!isLoading && !error && incomes.length === 0 && (
        <EmptyContainer
          icon={<HiArrowTrendingUp />}
          emptyText={
            "No income entries yet. Start by adding your first income source."
          }
          button={{
            buttonText: "Add income",
            buttonAction: () => handleCreateIncome(),
          }}></EmptyContainer>
      )}

      {!isLoading && !error && incomes.length > 0 && (
        <Container>
          <List data={incomes}>
            {(income) => (
              <ListItem className="group">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-text font-medium">{income.name}</span>
                    <span className="text-text font-semibold">
                      {formatAmount(income.amount, income.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <span>{formatDate(income.occurredAt)}</span>
                    {income.description && (
                      <span className="text-text-muted">
                        {income.description}
                      </span>
                    )}
                    {income.tags.length > 0 && (
                      <div className="flex gap-1">
                        {income.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 bg-surface-hover rounded text-xs">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
                  <IconButton
                    clicked={() => handleEditIncome(income)}
                    className="text-text-muted hover:text-text p-1">
                    <HiPencil className="w-5 h-5" />
                  </IconButton>
                  <IconButton
                    clicked={() => handleDeleteClick(income.id)}
                    className="text-danger hover:text-danger-hover p-1">
                    <HiTrash className="w-5 h-5" />
                  </IconButton>
                </div>
              </ListItem>
            )}
          </List>
        </Container>
      )}

      <AddOrCreateIncomeDialog
        open={isIncomeDialogOpen}
        onOpenChange={setIsIncomeDialogOpen}
        transaction={selectedIncome}
      />

      <DeleteDialog
        title="Delete Income"
        content={`Are you sure you want to delete the income "${selectedIncome?.name}"? This action cannot be undone.`}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: handleDeleteCancel,
            className: "hover:bg-surface-hover",
          },
          {
            buttonContent: "Delete",
            clicked: handleDeleteConfirm,
            variant: "danger",
          },
        ]}
      />

      <TransactionCsvImportDialog
        open={isCsvImportDialogOpen}
        onOpenChange={setIsCsvImportDialogOpen}
        onSuccess={() => {
          // Transactions will be refetched automatically via query invalidation
        }}
        defaultType="INCOME"
      />
    </>
  );
}
