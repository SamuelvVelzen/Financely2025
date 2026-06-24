import { getMonthsInRange } from "@/features/budget/utils/budget-presets";
import { formatDecimal } from "@/features/currency/utils/currencyhelpers";
import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type { ITag } from "@/features/shared/validation/schemas";
import { TagInline } from "@/features/tag/components/tag-display";
import { useTags } from "@/features/tag/hooks/useTags";
import { Accordion } from "@/features/ui/accordion/accordion";
import { Badge } from "@/features/ui/badge/badge";
import { IconButton } from "@/features/ui/button/icon-button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { useToast } from "@/features/ui/toast";
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

type ITagToRemove = {
  index: number;
  tagId: string;
  tagName: string;
};

type IBudgetFormItem = {
  tagId: string | null;
  categoryType?: "EXPENSE" | "INCOME" | null;
  expectedAmount: string;
  monthlyAmounts?: Array<{
    year: number;
    month: number;
    expectedAmount: string;
  }>;
};

type IBudgetFieldEntry = {
  field: { id: string };
  index: number;
};

export function BudgetItemForm({ selectedTagIds = [] }: IBudgetItemFormProps) {
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const orderedTags = useOrderedData(tags) as ITag[];
  const form = useFormContext();
  const toast = useToast();

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
  const [itemStateOverrides, setItemStateOverrides] = useState<
    Record<string, IItemState>
  >({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [tagToRemove, setTagToRemove] = useState<ITagToRemove | null>(null);

  const getItemKey = (tagId: string | null, categoryType: string | null) =>
    tagId ?? `misc_${categoryType ?? "EXPENSE"}`;

  // Sync fields with selected tags; always ensure both misc items (EXPENSE and INCOME)
  useEffect(() => {
    const currentItems = (form.getValues("budget.items") ??
      []) as IBudgetFormItem[];
    const currentTagIds = currentItems
      .map((item) => item.tagId)
      .filter((id): id is string => id !== null);
    const currentMiscExpense = currentItems.find(
      (item) => item.tagId === null && item.categoryType === "EXPENSE",
    );
    const currentMiscIncome = currentItems.find(
      (item) => item.tagId === null && item.categoryType === "INCOME",
    );

    const itemsToKeep = currentItems.filter((item) => {
      if (item.tagId === null) return true;
      return selectedTagIds.includes(item.tagId);
    });

    const newTagIds = selectedTagIds.filter(
      (id) => !currentTagIds.includes(id),
    );
    newTagIds.forEach((tagId) => {
      const newItem: IBudgetFormItem = { tagId, expectedAmount: "" };
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
      const miscItem: IBudgetFormItem = {
        tagId: null,
        categoryType,
        expectedAmount: "",
      };
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
        if (
          (item.expectedAmount === "" || item.expectedAmount === undefined) &&
          item.monthlyAmounts?.[0]
        ) {
          item.expectedAmount = item.monthlyAmounts[0].expectedAmount ?? "";
        }
      }
    }

    form.setValue("budget.items", itemsToKeep, { shouldValidate: false });
  }, [selectedTagIds, isPerMonth, months, form]);

  const budgetItems = form.watch("budget.items") as IBudgetFormItem[] | undefined;

  const formDerivedItemStates = useMemo(() => {
    if (!isPerMonth || months.length === 0) return {};

    const items = budgetItems ?? [];
    const next: Record<string, IItemState> = {};

    items.forEach((item) => {
      const key = getItemKey(item.tagId, item.categoryType ?? null);
      const amounts = item.monthlyAmounts ?? [];

      if (amounts.length === 0) {
        next[key] = { masterAmount: "", overriddenMonths: new Set() };
        return;
      }

      const firstVal = amounts[0]?.expectedAmount ?? "";
      const overrides = new Set<number>();
      amounts.forEach((ma, idx) => {
        if (
          idx > 0 &&
          ma.expectedAmount !== "" &&
          ma.expectedAmount !== firstVal
        ) {
          overrides.add(idx);
        }
      });

      next[key] = { masterAmount: firstVal, overriddenMonths: overrides };
    });

    return next;
  }, [isPerMonth, months.length, budgetItems]);

  const itemStates = useMemo(() => {
    if (!isPerMonth) return {};

    return { ...formDerivedItemStates, ...itemStateOverrides };
  }, [isPerMonth, formDerivedItemStates, itemStateOverrides]);

  const activeExpandedItems = isPerMonth ? expandedItems : new Set<string>();
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

  const groupedFields = useMemo(() => {
    const getTransactionType = (
      tagId: string
    ): "EXPENSE" | "INCOME" | null => {
      const tag = selectedTags.find((t) => t.id === tagId);
      return tag?.transactionType ?? null;
    };

    const expenseFields: IBudgetFieldEntry[] = [];
    const incomeFields: IBudgetFieldEntry[] = [];
    const miscExpenseFields: IBudgetFieldEntry[] = [];
    const miscIncomeFields: IBudgetFieldEntry[] = [];

    fields.forEach((field, index) => {
      const tagId = budgetItems?.[index]?.tagId ?? null;
      const categoryType = budgetItems?.[index]?.categoryType ?? null;
      if (tagId !== null) {
        const transactionType = getTransactionType(tagId);
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

    setItemStateOverrides((prev) => ({
      ...prev,
      [itemKey]: { masterAmount: newValue, overriddenMonths: overrides },
    }));
  };

  const handleSyncAll = (itemKey: string, itemIndex: number) => {
    const master =
      (form.getValues(
        `budget.items.${itemIndex}.expectedAmount`
      ) as string) ?? "";
    for (let j = 0; j < months.length; j++) {
      form.setValue(
        `budget.items.${itemIndex}.monthlyAmounts.${j}.expectedAmount`,
        master
      );
    }
    setItemStateOverrides((prev) => ({
      ...prev,
      [itemKey]: { masterAmount: master, overriddenMonths: new Set() },
    }));
  };

  const handleMonthValueChange = (
    itemKey: string,
    itemIndex: number,
    monthIndex: number,
    value: string
  ) => {
    const master =
      (form.getValues(
        `budget.items.${itemIndex}.expectedAmount`
      ) as string) ?? "";
    const prev = itemStates[itemKey];
    const newOverrides = new Set(prev?.overriddenMonths ?? []);
    if (value !== master) {
      newOverrides.add(monthIndex);
    } else {
      newOverrides.delete(monthIndex);
    }

    setItemStateOverrides((prevOverrides) => ({
      ...prevOverrides,
      [itemKey]: {
        masterAmount: prevOverrides[itemKey]?.masterAmount ?? prev?.masterAmount ?? master,
        overriddenMonths: newOverrides,
      },
    }));
  };

  const handleRevertMonth = (
    itemKey: string,
    itemIndex: number,
    monthIndex: number
  ) => {
    const master =
      (form.getValues(
        `budget.items.${itemIndex}.expectedAmount`
      ) as string) ?? "";
    form.setValue(
      `budget.items.${itemIndex}.monthlyAmounts.${monthIndex}.expectedAmount`,
      master
    );

    setItemStateOverrides((prev) => {
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

  const handleRemoveTagClick = (
    index: number,
    tagId: string | null,
    tagName: string
  ) => {
    if (tagId === null) return;
    setTagToRemove({ index, tagId, tagName });
  };

  const handleRemoveTagConfirm = () => {
    if (!tagToRemove) return;

    const currentSelected = (form.getValues("tags.selectedTagIds") ??
      []) as string[];
    form.setValue(
      "tags.selectedTagIds",
      currentSelected.filter((id) => id !== tagToRemove.tagId),
      { shouldValidate: true }
    );
    remove(tagToRemove.index);
    toast.success(`Removed ${tagToRemove.tagName}`);
    setTagToRemove(null);
  };

  const handleRemoveTagCancel = () => {
    setTagToRemove(null);
  };

  const isAllMonthsSynced = (
    masterAmount: string,
    monthlyAmounts: Array<{ expectedAmount?: string }>
  ) => {
    if (months.length === 0) return true;
    return months.every((_, mi) => {
      const monthAmount = monthlyAmounts[mi]?.expectedAmount ?? "";
      return monthAmount === masterAmount;
    });
  };

  const getTagEmoticon = (tagId: string | null) => {
    if (tagId === null) return null;
    const tag = selectedTags.find((t) => t.id === tagId);
    return tag?.emoticon ?? null;
  };

  // --- Tag icon helper ---
  const renderTagLeadingVisual = (
    tagColor: string | null,
    tagEmoticon: string | null,
  ) => {
    if (tagEmoticon) {
      return (
        <div className="size-5 flex items-center justify-center">
          <span className="text-lg">{tagEmoticon}</span>
        </div>
      );
    }

    if (tagColor) {
      return (
        <div className="size-5 flex items-center justify-center">
          <span
            className="size-3 rounded-full block"
            style={{ backgroundColor: tagColor }}
          />
        </div>
      );
    }

    return <HiSquares2X2 className="size-5 shrink-0 text-text-muted" />;
  };

  // --- Per-month item renderer ---
  const renderPerMonthItem = (field: IBudgetFieldEntry["field"], index: number) => {
    const tagId = form.watch(`budget.items.${index}.tagId`) as string | null;
    const categoryType = form.watch(
      `budget.items.${index}.categoryType`
    ) as string | null;
    const tagName = getTagName(tagId, categoryType);
    const tagColor = getTagColor(tagId);
    const tagEmoticon = getTagEmoticon(tagId);
    const itemKey = getItemKey(tagId, categoryType);
    const state = itemStates[itemKey] ?? {
      masterAmount: "",
      overriddenMonths: new Set<number>(),
    };
    const isExpanded = activeExpandedItems.has(itemKey);
    const overrideCount = state.overriddenMonths.size;

    const monthlyAmounts = budgetItems?.[index]?.monthlyAmounts ?? [];
    const yearlyTotal = monthlyAmounts.reduce((sum, ma) => {
      const val = parseFloat(ma?.expectedAmount || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const showYear =
      months.length > 0 &&
      new Set(months.map((mo) => mo.year)).size > 1;

    const masterAmount =
      (budgetItems?.[index]?.expectedAmount as string | undefined) ?? "";
    const allMonthsSynced = isAllMonthsSynced(masterAmount, monthlyAmounts);

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
          tabIndex={-1}
          aria-expanded={isExpanded}
          aria-label={`${tagName}, yearly total ${formatDecimal(yearlyTotal)}. Click to ${isExpanded ? "collapse" : "expand"} monthly breakdown`}>
          {renderTagLeadingVisual(tagColor, tagEmoticon)}

          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{tagName}</div>
            <Text size="xs" isMuted>
              Yearly total:{" "}
              {formatDecimal(yearlyTotal)}
            </Text>
          </div>

          <div className="w-28 shrink-0">
            <DecimalInput
              name={`budget.items.${index}.expectedAmount`}
              onValueChange={(val) =>
                handleMasterChange(itemKey, index, String(val ?? ""))
              }
            />
          </div>

          <IconButton
            size="sm"
            tabIndex={-1}
            clicked={() => handleSyncAll(itemKey, index)}
            ariaLabel="Apply to all months"
            tooltip="Apply base amount to all 12 months"
            disabled={allMonthsSynced}
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
            tabIndex={-1}
            clicked={() => toggleExpanded(itemKey)}
            ariaLabel="Toggle monthly breakdown"
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
            tabIndex={-1}
            clicked={() => handleRemoveTagClick(index, tagId, tagName)}
            ariaLabel={`Remove ${tagName}`}
            tooltip={`Remove ${tagName}`}
            className="text-danger"
            disabled={tagId === null}>
            <HiTrash />
          </IconButton>
        </div>

        {/* Monthly overrides accordion (months stacked top to bottom) */}
        <div
          inert={!isExpanded ? true : undefined}
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
                              tabIndex={-1}
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
                            index,
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
  const renderStandardItem = (_field: IBudgetFieldEntry["field"], index: number) => {
    const tagId = form.watch(`budget.items.${index}.tagId`) as string | null;
    const categoryType = form.watch(
      `budget.items.${index}.categoryType`
    ) as string | null;
    const tagName = getTagName(tagId, categoryType);
    const tagColor = getTagColor(tagId);
    const tagEmoticon = getTagEmoticon(tagId);

    return (
      <ListItem className="flex items-center gap-4 p-3">
        {renderTagLeadingVisual(tagColor, tagEmoticon)}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{tagName}</div>
        </div>
        <div className="w-32">
          <DecimalInput name={`budget.items.${index}.expectedAmount`} />
        </div>
        <IconButton
          size="sm"
          tabIndex={-1}
          clicked={() => handleRemoveTagClick(index, tagId, tagName)}
          ariaLabel={`Remove ${tagName}`}
          disabled={tagId === null}
          tooltip={`Remove ${tagName}`}
          className="text-danger"
        >
          <HiTrash />
        </IconButton>
      </ListItem>
    );
  };

  const renderBudgetItem = (field: IBudgetFieldEntry["field"], index: number) => {
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
      <DeleteDialog
        open={tagToRemove !== null}
        onOpenChange={(open) => {
          if (!open) handleRemoveTagCancel();
        }}
        title="Remove Tag"
        content={`Are you sure you want to remove "${tagToRemove?.tagName}" from this budget?`}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: handleRemoveTagCancel,
          },
          {
            buttonContent: "Remove",
            clicked: handleRemoveTagConfirm,
            variant: "danger",
          },
        ]}
      />

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
