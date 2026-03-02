import { getMonthsInRange } from "@/features/budget/utils/budget-presets";
import { formatDecimal } from "@/features/currency/utils/currencyhelpers";
import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type { ITag } from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { Accordion } from "@/features/ui/accordion/accordion";
import { Badge } from "@/features/ui/badge/badge";
import { IconButton } from "@/features/ui/button/icon-button";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Label } from "@/features/ui/typography/label";
import { Text } from "@/features/ui/typography/text";
import { cn } from "@/features/util/cn";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  HiChevronDown,
  HiDocumentDuplicate,
  HiSquares2X2,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";


type IBudgetItemFormProps = {
  selectedTagIds?: string[];
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type IItemState = {
  masterAmount: string;
  overriddenMonths: Set<number>;
};

export function BudgetItemForm({ selectedTagIds = [] }: IBudgetItemFormProps) {
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const orderedTags = useOrderedData(tags) as ITag[];
  const form = useFormContext();

  const preset = form.watch("general.preset") as string;
  const startDateStr = form.watch("general.startDate") as string;
  const endDateStr = form.watch("general.endDate") as string;
  const isPerMonth = preset === "yearly-per-month";

  const months = useMemo(() => {
    if (!isPerMonth || !startDateStr || !endDateStr) return [];
    const start = new Date(startDateStr.split("T")[0]);
    const end = new Date(endDateStr.split("T")[0]);
    return getMonthsInRange(start, end);
  }, [isPerMonth, startDateStr, endDateStr]);

  const selectedTags = useMemo(() => {
    return orderedTags.filter((tag) => selectedTagIds.includes(tag.id));
  }, [orderedTags, selectedTagIds]);

  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "budget.items",
  });

  // --- Per-month master/override state ---
  const [itemStates, setItemStates] = useState<Record<string, IItemState>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const getItemKey = (tagId: string | null, categoryType: string | null) =>
    tagId ?? `misc_${categoryType ?? "EXPENSE"}`;

  // Sync fields with selected tags; always ensure both misc items (EXPENSE and INCOME)
  useEffect(() => {
    const currentItems = form.getValues("budget.items") ?? [];
    const currentTagIds = currentItems
      .map((item: any) => item.tagId)
      .filter((id: string | null): id is string => id !== null);
    const currentMiscExpense = currentItems.find(
      (item: any) => item.tagId === null && item.categoryType === "EXPENSE"
    );
    const currentMiscIncome = currentItems.find(
      (item: any) => item.tagId === null && item.categoryType === "INCOME"
    );

    const itemsToKeep = currentItems.filter((item: any) => {
      if (item.tagId === null) return true;
      return selectedTagIds.includes(item.tagId);
    });

    const newTagIds = selectedTagIds.filter(
      (id) => !currentTagIds.includes(id)
    );
    newTagIds.forEach((tagId) => {
      const newItem: any = { tagId, expectedAmount: "" };
      if (isPerMonth && months.length > 0) {
        newItem.monthlyAmounts = months.map((m) => ({
          year: m.year,
          month: m.month,
          expectedAmount: "",
        }));
      }
      itemsToKeep.push(newItem);
    });

    const addMiscItem = (categoryType: "EXPENSE" | "INCOME") => {
      const miscItem: any = { tagId: null, categoryType, expectedAmount: "" };
      if (isPerMonth && months.length > 0) {
        miscItem.monthlyAmounts = months.map((m) => ({
          year: m.year,
          month: m.month,
          expectedAmount: "",
        }));
      }
      itemsToKeep.push(miscItem);
    };
    if (!currentMiscExpense) addMiscItem("EXPENSE");
    if (!currentMiscIncome) addMiscItem("INCOME");

    if (isPerMonth && months.length > 0) {
      for (const item of itemsToKeep) {
        if (!item.monthlyAmounts || item.monthlyAmounts.length === 0) {
          item.monthlyAmounts = months.map((m) => ({
            year: m.year,
            month: m.month,
            expectedAmount: item.expectedAmount || "",
          }));
        }
      }
    }

    form.setValue("budget.items", itemsToKeep, { shouldValidate: false });
  }, [selectedTagIds, isPerMonth, months.length]);

  // Initialize master/override state from existing form data
  useEffect(() => {
    if (!isPerMonth || months.length === 0) return;

    const items = form.getValues("budget.items") ?? [];
    setItemStates((prev) => {
      const next = { ...prev };
      let changed = false;

      (items as any[]).forEach((item) => {
        const key = getItemKey(item.tagId, item.categoryType ?? null);
        if (next[key]) return;

        const amounts = item.monthlyAmounts ?? [];
        if (amounts.length === 0) {
          next[key] = { masterAmount: "", overriddenMonths: new Set() };
          changed = true;
          return;
        }

        const firstVal = amounts[0]?.expectedAmount ?? "";
        const overrides = new Set<number>();
        amounts.forEach((ma: any, idx: number) => {
          if (
            idx > 0 &&
            ma.expectedAmount !== "" &&
            ma.expectedAmount !== firstVal
          ) {
            overrides.add(idx);
          }
        });

        next[key] = { masterAmount: firstVal, overriddenMonths: overrides };
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [isPerMonth, months.length, fields.length]);

  // Clear master/override state when leaving per-month mode
  useEffect(() => {
    if (!isPerMonth) {
      setItemStates({});
      setExpandedItems(new Set());
    }
  }, [isPerMonth]);

  // --- Helpers ---
  const getTagName = (
    tagId: string | null,
    categoryType?: string | null
  ) => {
    if (tagId === null) {
      return categoryType === "INCOME"
        ? "Miscellaneous (Income)"
        : "Miscellaneous (Expense)";
    }
    const tag = selectedTags.find((t) => t.id === tagId);
    return tag?.name ?? "Unknown";
  };

  const getTagColor = (tagId: string | null) => {
    if (tagId === null) return null;
    const tag = selectedTags.find((t) => t.id === tagId);
    return tag?.color ?? null;
  };

  const getTagTransactionType = (
    tagId: string | null
  ): "EXPENSE" | "INCOME" | null => {
    if (tagId === null) return null;
    const tag = selectedTags.find((t) => t.id === tagId);
    return tag?.transactionType ?? null;
  };

  const budgetItems = form.watch("budget.items") as
    | Array<{
        tagId: string | null;
        categoryType?: string | null;
        expectedAmount: string;
        monthlyAmounts?: Array<{
          year: number;
          month: number;
          expectedAmount: string;
        }>;
      }>
    | undefined;

  const groupedFields = useMemo(() => {
    const expenseFields: Array<{ field: any; index: number }> = [];
    const incomeFields: Array<{ field: any; index: number }> = [];
    const miscExpenseFields: Array<{ field: any; index: number }> = [];
    const miscIncomeFields: Array<{ field: any; index: number }> = [];

    fields.forEach((field, index) => {
      const tagId = budgetItems?.[index]?.tagId ?? null;
      const categoryType = budgetItems?.[index]?.categoryType ?? null;
      if (tagId !== null) {
        const transactionType = getTagTransactionType(tagId);
        if (transactionType === "EXPENSE") {
          expenseFields.push({ field, index });
        } else if (transactionType === "INCOME") {
          incomeFields.push({ field, index });
        } else {
          expenseFields.push({ field, index });
        }
      } else {
        if (categoryType === "INCOME") {
          miscIncomeFields.push({ field, index });
        } else {
          miscExpenseFields.push({ field, index });
        }
      }
    });

    return {
      expenseFields,
      incomeFields,
      miscExpenseFields,
      miscIncomeFields,
    };
  }, [fields, budgetItems, selectedTags]);

  // --- Master/Override handlers ---
  const handleMasterChange = (
    itemKey: string,
    itemIndex: number,
    newValue: string
  ) => {
    const overrides =
      itemStates[itemKey]?.overriddenMonths ?? new Set<number>();

    for (let j = 0; j < months.length; j++) {
      if (!overrides.has(j)) {
        form.setValue(
          `budget.items.${itemIndex}.monthlyAmounts.${j}.expectedAmount`,
          newValue
        );
      }
    }

    setItemStates((prev) => ({
      ...prev,
      [itemKey]: { masterAmount: newValue, overriddenMonths: overrides },
    }));
  };

  const handleSyncAll = (itemKey: string, itemIndex: number) => {
    const master = itemStates[itemKey]?.masterAmount ?? "";
    for (let j = 0; j < months.length; j++) {
      form.setValue(
        `budget.items.${itemIndex}.monthlyAmounts.${j}.expectedAmount`,
        master
      );
    }
    setItemStates((prev) => ({
      ...prev,
      [itemKey]: { masterAmount: master, overriddenMonths: new Set() },
    }));
  };

  const handleMonthValueChange = (
    itemKey: string,
    monthIndex: number,
    value: string
  ) => {
    const state = itemStates[itemKey];
    if (!state) return;

    const newOverrides = new Set(state.overriddenMonths);
    if (value !== state.masterAmount) {
      newOverrides.add(monthIndex);
    } else {
      newOverrides.delete(monthIndex);
    }

    setItemStates((prev) => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], overriddenMonths: newOverrides },
    }));
  };

  const handleRevertMonth = (
    itemKey: string,
    itemIndex: number,
    monthIndex: number
  ) => {
    const master = itemStates[itemKey]?.masterAmount ?? "";
    form.setValue(
      `budget.items.${itemIndex}.monthlyAmounts.${monthIndex}.expectedAmount`,
      master
    );

    setItemStates((prev) => {
      const current = prev[itemKey];
      if (!current) return prev;
      const newOverrides = new Set(current.overriddenMonths);
      newOverrides.delete(monthIndex);
      return {
        ...prev,
        [itemKey]: { ...current, overriddenMonths: newOverrides },
      };
    });
  };

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  // --- Tag icon helper ---
  const renderTagIcon = (tagColor: string | null) =>
    tagColor ? (
      <div className="size-5 flex items-center justify-center">
        <span
          className="size-3 rounded-full block"
          style={{ backgroundColor: tagColor }}
        />
      </div>
    ) : (
      <HiSquares2X2 className="size-5 shrink-0 text-text-muted" />
    );

  // --- Per-month item renderer ---
  const renderPerMonthItem = (field: any, index: number) => {
    const tagId = form.watch(`budget.items.${index}.tagId`) as string | null;
    const categoryType = form.watch(
      `budget.items.${index}.categoryType`
    ) as string | null;
    const tagName = getTagName(tagId, categoryType);
    const tagColor = getTagColor(tagId);
    const itemKey = getItemKey(tagId, categoryType);
    const state = itemStates[itemKey] ?? {
      masterAmount: "",
      overriddenMonths: new Set<number>(),
    };
    const isExpanded = expandedItems.has(itemKey);
    const overrideCount = state.overriddenMonths.size;

    const monthlyAmounts = budgetItems?.[index]?.monthlyAmounts ?? [];
    const yearlyTotal = monthlyAmounts.reduce((sum, ma) => {
      const val = parseFloat(ma?.expectedAmount || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const showYear =
      months.length > 0 &&
      new Set(months.map((mo) => mo.year)).size > 1;

    return (
      <ListItem className="flex-col ">
        {/* Main row — clickable to toggle monthly breakdown; buttons/inputs don't trigger toggle */}
        <div
          className="flex items-center gap-3 w-full cursor-pointer"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button, input")) return;
            toggleExpanded(itemKey);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            if ((e.target as HTMLElement).closest("button, input")) return;
            e.preventDefault();
            toggleExpanded(itemKey);
          }}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`${tagName}, yearly total ${formatDecimal(yearlyTotal)}. Click to ${isExpanded ? "collapse" : "expand"} monthly breakdown`}>
          {renderTagIcon(tagColor)}

          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{tagName}</div>
            <Text size="xs" isMuted>
              Yearly total:{" "}
              {formatDecimal(yearlyTotal)}
            </Text>
          </div>

          <div className="w-28 shrink-0">
            <DecimalInput
              value={state.masterAmount}
              onChange={(val) =>
                handleMasterChange(itemKey, index, String(val ?? ""))
              }
            />
          </div>

          <IconButton
            size="sm"
            clicked={() => handleSyncAll(itemKey, index)}
            aria-label="Apply to all months"
            tooltip="Apply base amount to all 12 months"
          >
            <HiDocumentDuplicate />
          </IconButton>

          {overrideCount > 0 && (
            <Badge
              variant="primary"
              tooltip={`${overrideCount} month${overrideCount > 1 ? "s" : ""} overridden`}>
              {overrideCount}
            </Badge>
          )}

          <IconButton
            size="sm"
            clicked={() => toggleExpanded(itemKey)}
            aria-label="Toggle monthly breakdown"
            tooltip="Toggle monthly breakdown"
            className={cn(
              overrideCount > 0 ? "text-primary" : "text-text-muted hover:text-text"
            )}>
            <HiChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </IconButton>

          <IconButton
            size="sm"
            clicked={() => {
              if (tagId === null) return;
              const currentSelected = (form.getValues("tags.selectedTagIds") ?? []) as string[];
              form.setValue(
                "tags.selectedTagIds",
                currentSelected.filter((id) => id !== tagId),
                { shouldValidate: true }
              );
              remove(index);
            }}
            aria-label={`Remove ${tagName}`}
            tooltip={`Remove ${tagName}`}
            className="text-danger"
            disabled={tagId === null}>
            <HiTrash />
          </IconButton>
        </div>

        {/* Monthly overrides accordion (months stacked top to bottom) */}
        <div
          className={cn(
            "grid transition-[grid-template-rows] ease-out w-full",
            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}>
          <div className="overflow-hidden">
            <div
              className={cn(
                "pt-3 mt-3 gap-x-6 gap-y-2 grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 pb-0.5",
                isExpanded && "border-t border-border/50"
              )}
            >
              {months.map((m, mi) => {
                const isOverridden = state.overriddenMonths.has(mi);
                return (
                  <div
                    key={`${m.year}-${m.month}`}
                    className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "text-sm shrink-0",
                        isOverridden
                          ? "text-text"
                          : "text-text-muted"
                      )}>
                      {MONTH_LABELS[m.month - 1]}
                      {showYear ? ` ${m.year}` : ""}
                    </span>
                    <div
                      className={cn(
                        "w-28 shrink-0 transition-opacity",
                        !isOverridden && "opacity-45"
                      )}>
                      <DecimalInput
                        name={`budget.items.${index}.monthlyAmounts.${mi}.expectedAmount`}
                        className={isOverridden ? "text-primary border-primary" : ""}
                        onFocus={
                          !isOverridden
                            ? (e: React.FocusEvent<HTMLInputElement>) =>
                              e.target.select()
                            : undefined
                        }
                        suffixIcon={
                          isOverridden ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleRevertMonth(itemKey, index, mi)
                              }
                              title="Revert to base amount"
                              className="text-text-muted hover:text-text cursor-pointer p-0.5"
                              aria-label={`Revert ${MONTH_LABELS[m.month - 1]}`}>
                              <HiXMark className="size-3.5" />
                            </button>
                          ) : undefined
                        }
                        onValueChange={(val) =>
                          handleMonthValueChange(
                            itemKey,
                            mi,
                            String(val ?? "")
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ListItem>
    );
  };

  // --- Standard (non-per-month) item renderer ---
  const renderStandardItem = (field: any, index: number) => {
    const tagId = form.watch(`budget.items.${index}.tagId`) as string | null;
    const categoryType = form.watch(
      `budget.items.${index}.categoryType`
    ) as string | null;
    const tagName = getTagName(tagId, categoryType);
    const tagColor = getTagColor(tagId);

    return (
      <ListItem className="flex items-center gap-4 p-3">
        {renderTagIcon(tagColor)}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{tagName}</div>
        </div>
        <div className="w-32">
          <DecimalInput name={`budget.items.${index}.expectedAmount`} />
        </div>
        <IconButton
          size="sm"
          clicked={() => {
            if (tagId === null) return;
            const currentSelected = (form.getValues("tags.selectedTagIds") ?? []) as string[];
            form.setValue(
              "tags.selectedTagIds",
              currentSelected.filter((id) => id !== tagId),
              { shouldValidate: true }
            );
            remove(index);
          }}
          aria-label={`Remove ${tagName}`}
          disabled={tagId === null}
          tooltip={`Remove ${tagName}`}
          className="text-danger"
        >
          <HiTrash />
        </IconButton>
      </ListItem>
    );
  };

  const renderBudgetItem = (field: any, index: number) => {
    if (isPerMonth && months.length > 0) {
      return renderPerMonthItem(field, index);
    }
    return renderStandardItem(field, index);
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        Select tags above to set budget amounts
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>
          {isPerMonth
            ? "Set Expected Amounts (Per Month)"
            : "Set Expected Amounts"}
        </Label>
        {isPerMonth && (
          <Text size="xs" isMuted className="mt-1">
            Set a base amount per tag, then expand to customize individual
            months.
          </Text>
        )}
      </div>

      <div className="space-y-4">
        {(groupedFields.expenseFields.length > 0 ||
          groupedFields.miscExpenseFields.length > 0) && (
          <Accordion
            title="Expense Tags"
            defaultOpen={true}
            onOpenChange={(open) => {
              if (!open) setExpandedItems(new Set());
            }}>
            <List
              data={[
                ...groupedFields.expenseFields,
                ...groupedFields.miscExpenseFields,
              ]}
              getItemKey={(item) =>
                getItemKey(
                  budgetItems?.[item.index]?.tagId ?? null,
                  budgetItems?.[item.index]?.categoryType ?? null
                )
              }>
              {({ field, index }) => renderBudgetItem(field, index)}
            </List>
          </Accordion>
        )}

        {(groupedFields.incomeFields.length > 0 ||
          groupedFields.miscIncomeFields.length > 0) && (
          <Accordion
            title="Income Tags"
            defaultOpen={true}
            onOpenChange={(open) => {
              if (!open) setExpandedItems(new Set());
            }}>
            <List
              data={[
                ...groupedFields.incomeFields,
                ...groupedFields.miscIncomeFields,
              ]}
              getItemKey={(item) =>
                getItemKey(
                  budgetItems?.[item.index]?.tagId ?? null,
                  budgetItems?.[item.index]?.categoryType ?? null
                )
              }>
              {({ field, index }) => renderBudgetItem(field, index)}
            </List>
          </Accordion>
        )}
      </div>
    </div>
  );
}
