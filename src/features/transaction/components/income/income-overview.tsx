import type { ITransaction } from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { TransactionCsvImportDialog } from "@/features/transaction/components/transaction-csv-import-dialog";
import {
  useDeleteIncome,
  useIncomes,
} from "@/features/transaction/hooks/useTransactions";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import {
  Datepicker,
  type IDateFilter,
} from "@/features/ui/datepicker/datepicker";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { Form } from "@/features/ui/form/form";
import { RangeInput, type IPriceRange } from "@/features/ui/input/range-input";
import { SearchInput } from "@/features/ui/input/search-input";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { Title } from "@/features/ui/typography/title";
import { formatCurrency } from "@/util/currency/currencyhelpers";
import { formatMonthYear } from "@/util/date/date-helpers";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  HiArrowDownTray,
  HiArrowTrendingUp,
  HiPencil,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";
import { AddOrCreateIncomeDialog } from "./add-or-create-income-dialog";

type FilterFormData = {
  searchQuery: string;
  tagFilter: string[];
};

export function IncomeOverview() {
  // Filter state
  const [dateFilter, setDateFilter] = useState<IDateFilter>({
    type: "allTime",
    from: undefined,
    to: undefined,
  });
  const [priceFilter, setPriceFilter] = useState<IPriceRange>({
    min: undefined,
    max: undefined,
  });

  // Form for search and tag filter
  const filterForm = useForm<FilterFormData>({
    defaultValues: {
      searchQuery: "",
      tagFilter: [],
    },
  });
  const searchQuery = filterForm.watch("searchQuery") || "";
  const tagFilter = filterForm.watch("tagFilter") || [];

  // Fetch incomes with date filter (backend filtering)
  // Only pass date filters if not "allTime"
  const { data, isLoading, error } = useIncomes(
    dateFilter.type !== "allTime" && (dateFilter.from || dateFilter.to)
      ? ({
          from: dateFilter.from,
          to: dateFilter.to,
        } as Parameters<typeof useIncomes>[0])
      : undefined
  );
  const allIncomes = data?.data ?? [];

  // Fetch tags for tag filter
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];

  const { mutate: deleteIncome } = useDeleteIncome();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<
    ITransaction | undefined
  >(undefined);

  // Client-side filtering for price, tags, and search
  const incomes = useMemo(() => {
    return allIncomes.filter((income) => {
      // Price filter
      if (priceFilter.min !== undefined || priceFilter.max !== undefined) {
        const amount = parseFloat(income.amount);
        if (priceFilter.min !== undefined && amount < priceFilter.min) {
          return false;
        }
        if (priceFilter.max !== undefined && amount > priceFilter.max) {
          return false;
        }
      }

      // Tag filter
      if (tagFilter.length > 0) {
        const incomeTagIds = income.tags.map((tag) => tag.id);
        const hasMatchingTag = tagFilter.some((tagId) =>
          incomeTagIds.includes(tagId)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = income.name.toLowerCase().includes(query);
        const descriptionMatch = income.description
          ?.toLowerCase()
          .includes(query);
        const tagMatch = income.tags.some((tag) =>
          tag.name.toLowerCase().includes(query)
        );
        const amountMatch = income.amount.includes(query);

        if (!nameMatch && !descriptionMatch && !tagMatch && !amountMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allIncomes, priceFilter, tagFilter, searchQuery]);

  // Search highlight function
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-primary/20 text-primary">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleCreateIncome = () => {
    setSelectedIncome(undefined);
    setIsIncomeDialogOpen(true);
  };

  const handleEditIncome = (income: ITransaction) => {
    setSelectedIncome(income);
    setIsIncomeDialogOpen(true);
  };

  const handleDeleteClick = (incomeId: string) => {
    setSelectedIncome(allIncomes.find((income) => income.id === incomeId));
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

  // Tag options for SelectDropdown
  const tagOptions = tags.map((tag) => ({
    value: tag.id,
    label: tag.name,
    data: tag,
  }));

  // Get month display text from date filter
  const getMonthDisplay = (): string => {
    if (dateFilter.type === "allTime") {
      return "All Time";
    }
    if (dateFilter.type === "thisMonth") {
      return formatMonthYear(new Date());
    }
    if (dateFilter.type === "lastMonth") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return formatMonthYear(lastMonth);
    }
    if (dateFilter.type === "custom" && dateFilter.from) {
      return formatMonthYear(dateFilter.from);
    }
    return formatMonthYear(new Date());
  };

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface mb-4">
        <Title className="flex items-center justify-between mb-4">
          <div className="flex gap-2 items-center">
            <HiArrowTrendingUp />
            <div className="flex items-center gap-2">
              <span>Incomes</span>
              <span className="text-sm text-text-muted font-normal">
                ({getMonthDisplay()})
              </span>
            </div>
          </div>

          <Dropdown>
            <DropdownItem
              icon={<HiArrowTrendingUp />}
              clicked={() => handleCreateIncome()}
            >
              Add income
            </DropdownItem>
            <DropdownItem
              icon={<HiArrowDownTray />}
              clicked={() => setIsCsvImportDialogOpen(true)}
            >
              Import from CSV
            </DropdownItem>
          </Dropdown>
        </Title>

        <div className="flex gap-3 items-end pb-4 pt-2 px-2 overflow-x-auto">
          <Form form={filterForm} onSubmit={() => {}}>
            <div className="flex gap-3 items-end">
              <div className="min-w-[200px] shrink-0">
                <SearchInput name="searchQuery" />
              </div>

              <Datepicker value={dateFilter} onChange={setDateFilter} />

              <div className="w-[400px] shrink-0">
                <RangeInput
                  value={priceFilter}
                  onChange={setPriceFilter}
                  minLabel="Min"
                  maxLabel="Max"
                  placeholder={{ min: "Min", max: "Max" }}
                />
              </div>

              <SelectDropdown
                name="tagFilter"
                options={tagOptions}
                multiple={true}
                placeholder="Filter by tags"
                children={(option) => (
                  <>
                    {option.data?.color && (
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: option.data.color }}
                      />
                    )}
                    <span className="flex-1">{option.label}</span>
                  </>
                )}
              />
            </div>
          </Form>
        </div>
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

      {!isLoading &&
        !error &&
        incomes.length === 0 &&
        allIncomes.length === 0 && (
          <EmptyContainer
            icon={<HiPlus />}
            emptyText={
              "No income entries yet. Start by adding your first income source."
            }
            button={{
              buttonText: "Add income",
              buttonAction: () => handleCreateIncome(),
            }}
          ></EmptyContainer>
        )}

      {!isLoading &&
        !error &&
        incomes.length === 0 &&
        allIncomes.length > 0 && (
          <EmptyContainer
            icon={<HiPlus />}
            emptyText={
              "No incomes match your filters. Try adjusting your search criteria."
            }
          />
        )}

      {!isLoading && !error && incomes.length > 0 && (
        <Container>
          <List data={incomes}>
            {(income) => (
              <ListItem className="group">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-text font-medium">
                      {searchQuery
                        ? highlightText(income.name, searchQuery)
                        : income.name}
                    </span>
                    <span className="text-text font-semibold">
                      {searchQuery
                        ? highlightText(
                            formatCurrency(income.amount, income.currency),
                            searchQuery
                          )
                        : formatCurrency(income.amount, income.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <span>{formatDate(income.occurredAt)}</span>
                    {income.description && (
                      <span className="text-text-muted">
                        {searchQuery
                          ? highlightText(income.description, searchQuery)
                          : income.description}
                      </span>
                    )}
                    {income.tags.length > 0 && (
                      <div className="flex gap-1">
                        {income.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 bg-surface-hover rounded text-xs"
                          >
                            {searchQuery
                              ? highlightText(tag.name, searchQuery)
                              : tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
                  <IconButton
                    clicked={() => handleEditIncome(income)}
                    className="text-text-muted hover:text-text p-1"
                  >
                    <HiPencil className="w-5 h-5" />
                  </IconButton>
                  <IconButton
                    clicked={() => handleDeleteClick(income.id)}
                    className="text-danger hover:text-danger-hover p-1"
                  >
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
