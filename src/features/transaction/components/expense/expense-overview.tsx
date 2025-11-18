import type { ITransaction } from "@/features/shared/validation/schemas";
import { TransactionCsvImportDialog } from "@/features/transaction/components/transaction-csv-import-dialog";
import {
  useDeleteExpense,
  useExpenses,
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
import { formatCurrency } from "@/util/currency/currencyhelpers";
import { useState } from "react";
import {
  HiArrowDownTray,
  HiArrowTrendingDown,
  HiPencil,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";
import { AddOrCreateExpenseDialog } from "./add-or-create-expense-dialog";

export function ExpenseOverview() {
  const { data, isLoading, error } = useExpenses();
  const expenses = data?.data ?? [];
  const { mutate: deleteExpense } = useDeleteExpense();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<
    ITransaction | undefined
  >(undefined);

  const [enabledMultiSelect, setEnabledMultiSelect] = useState(false);

  const handleCreateExpense = () => {
    setSelectedExpense(undefined);
    setIsExpenseDialogOpen(true);
  };

  const handleEditExpense = (expense: ITransaction) => {
    setSelectedExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteClick = (expenseId: string) => {
    setSelectedExpense(expenses.find((expense) => expense.id === expenseId));
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedExpense) {
      deleteExpense(selectedExpense.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedExpense(undefined);
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedExpense(undefined);
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
            <HiArrowTrendingDown />

            <span>Expenses</span>
          </div>

          <Dropdown>
            <DropdownItem
              icon={<HiPlus />}
              clicked={() => handleCreateExpense()}>
              Add expense
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
          <p className="text-text-muted text-center">Loading expenses...</p>
        </Container>
      )}

      {error && (
        <Container>
          <p className="text-red-500 text-center">
            Error loading expenses: {error.message}
          </p>
        </Container>
      )}

      {!isLoading && !error && expenses.length === 0 && (
        <EmptyContainer
          icon={<HiArrowTrendingDown />}
          emptyText={"No expenses yet. Start by adding your first expense."}
          button={{
            buttonText: "Add expense",
            buttonAction: () => handleCreateExpense(),
          }}></EmptyContainer>
      )}

      {!isLoading && !error && expenses.length > 0 && (
        <Container>
          <List data={expenses}>
            {(expense) => (
              <ListItem className="group">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-text font-medium">
                      {expense.name}
                    </span>
                    <span className="text-text font-semibold">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <span>{formatDate(expense.occurredAt)}</span>
                    {expense.description && (
                      <span className="text-text-muted">
                        {expense.description}
                      </span>
                    )}
                    {expense.tags.length > 0 && (
                      <div className="flex gap-1">
                        {expense.tags.map((tag) => (
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
                    clicked={() => handleEditExpense(expense)}
                    className="text-text-muted hover:text-text p-1">
                    <HiPencil className="w-5 h-5" />
                  </IconButton>
                  <IconButton
                    clicked={() => handleDeleteClick(expense.id)}
                    className="text-danger hover:text-danger-hover p-1">
                    <HiTrash className="w-5 h-5" />
                  </IconButton>
                </div>
              </ListItem>
            )}
          </List>
        </Container>
      )}

      <AddOrCreateExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        transaction={selectedExpense}
      />

      <DeleteDialog
        title="Delete Expense"
        content={`Are you sure you want to delete the expense "${selectedExpense?.name}"? This action cannot be undone.`}
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
        defaultType="EXPENSE"
      />
    </>
  );
}
