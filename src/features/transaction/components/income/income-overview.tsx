import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { TransactionCsvImportDialog } from "@/features/transaction/components/transaction-import/transaction-csv-import-dialog";
import {
  useDeleteIncome,
  useIncomes,
} from "@/features/transaction/hooks/useTransactions";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import {
  Datepicker,
  type IDateFilter,
} from "@/features/ui/datepicker/datepicker";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownDivider } from "@/features/ui/dropdown/dropdown-divider";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { type IPriceRange, RangeInput } from "@/features/ui/input/range-input";
import { SearchInput } from "@/features/ui/input/search-input";
import { Pagination } from "@/features/ui/pagination";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { cn } from "@/features/util/cn";
import {
  formatMonthYear,
  getCurrentMonthEnd,
  getCurrentMonthStart,
} from "@/features/util/date/date-helpers";
import { useDebouncedValue } from "@/features/util/use-debounced-value";
import { useMemo, useRef, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowTrendingUp,
  HiArrowUpTray,
  HiPlus,
} from "react-icons/hi2";
import { exportTransactionsToCsv } from "../../utils/export-csv";
import { AddOrCreateIncomeDialog } from "./add-or-create-income-dialog";
import { IncomeList } from "./income-list";

const PAGE_SIZE = 20;

const defaultDateFilter: IDateFilter = {
  type: "thisMonth",
  from: getCurrentMonthStart(),
  to: getCurrentMonthEnd(),
};

const defaultPriceFilter: IPriceRange = {
  min: undefined,
  max: undefined,
};

type FilterFormData = {
  searchQuery: string;
  tagFilter: string[];
};

export function IncomeOverview() {
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
  const [dateFilter, setDateFilter] = useState<IDateFilter>(defaultDateFilter);
  const [priceFilter, setPriceFilter] =
    useState<IPriceRange>(defaultPriceFilter);

  // Form for search and tag filter (requires form context)
  const filterForm = useFinForm<FilterFormData>({
    defaultValues: {
      searchQuery: "",
      tagFilter: [],
    },
  });

  const searchQuery = filterForm.watch("searchQuery") ?? "";
  const tagFilter = filterForm.watch("tagFilter") ?? [];

  // Track previous filter values to reset page only when values actually change
  const prevFilterKey = useRef<string>("");
  const filterKey = useMemo(
    () =>
      JSON.stringify({
        dateType: dateFilter.type,
        dateFrom: dateFilter.from,
        dateTo: dateFilter.to,
        priceMin: priceFilter.min,
        priceMax: priceFilter.max,
        search: searchQuery,
        tags: tagFilter.join(","),
      }),
    [dateFilter, priceFilter, searchQuery, tagFilter]
  );

  // Reset to page 1 only when filter values actually change
  if (prevFilterKey.current !== "" && prevFilterKey.current !== filterKey) {
    setCurrentPage(1);
  }
  prevFilterKey.current = filterKey;

  // Build query with pagination and all filters (backend filtering)
  const query = useMemo((): Parameters<typeof useIncomes>[0] => {
    return {
      page: currentPage,
      limit: PAGE_SIZE,
      // Date filter
      from: dateFilter.type !== "allTime" ? dateFilter.from : undefined,
      to: dateFilter.type !== "allTime" ? dateFilter.to : undefined,
      // Tag filter
      tagIds: tagFilter.length > 0 ? tagFilter : undefined,
      // Search filter
      q: searchQuery.trim() || undefined,
      // Amount filter
      minAmount: priceFilter.min?.toString(),
      maxAmount: priceFilter.max?.toString(),
    };
  }, [currentPage, dateFilter, tagFilter, searchQuery, priceFilter]);

  // Debounce query to reduce API calls during rapid filter changes
  const debouncedQuery = useDebouncedValue(query, 300);

  // Fetch incomes with all filters applied by backend
  const { data, isLoading, error } = useIncomes(debouncedQuery, {
    placeholderData: (previousData) => previousData,
  });
  const incomes = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const { mutate: deleteIncome } = useDeleteIncome();
  const toast = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<
    ITransaction | undefined
  >(undefined);

  // Tags for filter dropdown
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const orderedTags = useOrderedData(tags);

  const tagOptions = useMemo(() => {
    return orderedTags.map((tag) => ({
      value: tag.id,
      label: tag.name,
      data: tag,
    }));
  }, [orderedTags]);

  const handleCreateIncome = () => {
    setSelectedIncome(undefined);
    setIsIncomeDialogOpen(true);
  };

  const handleEditIncome = (income: ITransaction) => {
    setSelectedIncome(income);
    setIsIncomeDialogOpen(true);
  };

  const handleDeleteClick = (income: ITransaction) => {
    setSelectedIncome(income);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedIncome) {
      deleteIncome(selectedIncome.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedIncome(undefined);
          toast.success("Income deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete income");
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedIncome(undefined);
  };

  const clearFilters = () => {
    setDateFilter(defaultDateFilter);
    setPriceFilter(defaultPriceFilter);
    filterForm.reset({ searchQuery: "", tagFilter: [] });
  };

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
    if (dateFilter.type === "custom" && dateFilter.from && dateFilter.to) {
      const from = formatMonthYear(dateFilter.from);
      const to = formatMonthYear(dateFilter.to);
      return `${from} - ${to}`;
    }
    return formatMonthYear(new Date());
  };

  // Check if any filter is active (non-default)
  const hasActiveFilters = useMemo(() => {
    return (
      dateFilter.type !== defaultDateFilter.type ||
      priceFilter.min !== undefined ||
      priceFilter.max !== undefined ||
      searchQuery.trim() !== "" ||
      tagFilter.length > 0
    );
  }, [dateFilter, priceFilter, searchQuery, tagFilter]);

  const isEmpty = useMemo(() => {
    return !isLoading && !error && incomes.length === 0 && !hasActiveFilters;
  }, [incomes, isLoading, error, hasActiveFilters]);

  const isEmptyWithFilters = useMemo(() => {
    return !isLoading && !error && incomes.length === 0 && hasActiveFilters;
  }, [incomes, isLoading, error, hasActiveFilters]);

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface pb-0 mb-4">
        <Title className="grid grid-cols-[1fr_auto] gap-2 items-center mb-3">
          <div className="flex gap-2 items-center">
            <HiArrowTrendingUp />
            <span>Incomes</span>
            <span className="text-sm text-text-muted font-normal self-end">
              ({getMonthDisplay()})
            </span>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              clicked={handleCreateIncome}
              variant="primary"
              size="sm">
              <HiPlus className="size-6" /> Add
            </Button>

            <Dropdown>
              <DropdownItem
                icon={<HiArrowDownTray />}
                clicked={() => setIsCsvImportDialogOpen(true)}>
                Import from CSV
              </DropdownItem>

              <DropdownDivider />
              <DropdownItem
                icon={<HiArrowUpTray />}
                clicked={() =>
                  exportTransactionsToCsv(
                    incomes,
                    ["Name", "Amount", "Date", "Description", "Tags"],
                    "incomes"
                  )
                }>
                Export from CSV
              </DropdownItem>
            </Dropdown>
          </div>
        </Title>

        {/* Inline Filters */}
        <div
          className={cn("flex gap-3 items-end pb-4 pt-2 px-2 overflow-x-auto")}>
          <Form
            form={filterForm}
            onSubmit={() => {}}>
            <div className="flex gap-3 items-end">
              <SearchInput name="searchQuery" />

              <Datepicker
                value={dateFilter}
                onChange={setDateFilter}
              />

              <RangeInput
                value={priceFilter}
                onChange={setPriceFilter}
                className="w-[400px]"
              />

              <SelectDropdown
                name="tagFilter"
                options={tagOptions}
                multiple
                placeholder="Filter by tags"
                children={(option) => (
                  <>
                    {option.data?.color && (
                      <div
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: option.data.color }}
                      />
                    )}
                    <span>{option.label}</span>
                  </>
                )}
              />
            </div>
          </Form>
        </div>
      </Container>

      <Container>
        {isEmpty && (
          <EmptyPage
            icon={HiArrowTrendingUp}
            emptyText={
              "No income entries yet. Start by adding your first income source."
            }
            button={{
              buttonContent: "Add income",
              clicked: handleCreateIncome,
            }}></EmptyPage>
        )}

        {isEmptyWithFilters && (
          <EmptyPage
            icon={HiArrowTrendingUp}
            emptyText={
              "No incomes match your filters. Try adjusting your search criteria or clearing your filters."
            }
            button={{
              buttonContent: "Clear filters",
              clicked: clearFilters,
            }}
          />
        )}

        {!isEmpty && !isEmptyWithFilters && (
          <>
            <IncomeList
              data={incomes}
              searchQuery={searchQuery}
              onDelete={handleDeleteClick}
              onEdit={handleEditIncome}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-4"
            />
          </>
        )}
      </Container>

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
      />
    </>
  );
}
