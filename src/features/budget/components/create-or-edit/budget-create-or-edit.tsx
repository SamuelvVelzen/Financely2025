import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { useDefaultCurrency } from "@/features/workspace/hooks/useWorkspaceSettings";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import {
  useBudget,
  useCreateBudget,
  useUpdateBudget,
} from "@/features/budget/hooks/useBudgets";
import { getBudgetMonthsFromDateStrings } from "@/features/budget/utils/budget-form-transform";
import {
  formatBudgetName,
  getCurrentYearPreset,
  type IBudgetPreset,
} from "@/features/budget/utils/budget-presets";
import { CurrencySelect } from "@/features/currency/components/currency-select";
import { parseLocalizedDecimal } from "@/features/currency/utils/currencyhelpers";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  type IBudget,
  type IBudgetItem,
  type IBudgetPeriodType,
  type ICreateBudgetInput,
  type IUpdateBudgetInput,
} from "@/features/shared/validation/schemas";
import { Alert } from "@/features/ui/alert/alert";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { TextInput } from "@/features/ui/input/text-input";
import { Loading } from "@/features/ui/loading/loading";
import {
  Tab,
  TabContent,
  TabGroup,
  type ITabGroupRef,
} from "@/features/ui/tab";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBlocker, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FieldErrors } from "react-hook-form";
import { HiArrowLeft, HiOutlineCurrencyEuro } from "react-icons/hi2";
import { z } from "zod";
import { BudgetItemForm } from "./budget-item-form";
import { BudgetPresetSelector } from "./budget-preset-selector";
import { BudgetTagSelector } from "./budget-tag-selector";

type IBudgetCreateOrEditPageProps = {
  budgetId?: string;
};

const TABS = ["general", "tags", "budget"] as const;
const TABS_ARRAY = ["general", "tags", "budget"] as string[];
type ITabValue = (typeof TABS)[number];

const DEFAULT_CURRENCY = "EUR";

const MonthlyAmountEntrySchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12),
  expectedAmount: z.string(),
});

const BUDGET_AMOUNT_MIN_MESSAGE = "Amount should be higher than 0";

function budgetAmountIsPositive(
  raw: string | number | undefined | null
): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0;
  }
  if (typeof raw === "object") {
    const boxed = raw as { toFixed?: (n: number) => string };
    if (typeof boxed.toFixed === "function") {
      return budgetAmountIsPositive(boxed.toFixed(2));
    }
    return false;
  }
  const trimmed = String(raw).trim();
  if (!trimmed) {
    return false;
  }
  const primary = parseLocalizedDecimal(trimmed);
  if (primary) {
    const n = Number(primary);
    return Number.isFinite(n) && n > 0;
  }
  const compact = trimmed.replace(/\s|\u00A0/g, "");
  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  let candidate = compact;
  if (lastComma !== -1 && lastComma > lastDot) {
    candidate = compact.replace(/\./g, "").replace(",", ".");
  } else {
    candidate = compact.replace(/,/g, "");
  }
  const n = Number(candidate);
  return Number.isFinite(n) && n > 0;
}

const BudgetFormSchema = z.object({
  general: z
    .object({
      name: z
        .string()
        .min(1, "Name is required")
        .max(200, "Name must be less than 200 characters"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      currency: z.string().min(1, "Currency is required"),
      preset: z.enum(["monthly", "yearly", "yearly-per-month", "custom"]),
      year: z.number().optional(),
      month: z.number().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.startDate && data.endDate) {
        if (new Date(data.endDate) < new Date(data.startDate)) {
          ctx.addIssue({
            code: "custom",
            message: "End date must be after or equal to start date",
            path: ["endDate"],
          });
        }
      }

      if (data.preset === "monthly") {
        if (data.year === undefined || data.year === null) {
          ctx.addIssue({
            code: "custom",
            message: "Year is required for monthly preset",
            path: ["year"],
          });
        }
        if (data.month === undefined || data.month === null) {
          ctx.addIssue({
            code: "custom",
            message: "Month is required for monthly preset",
            path: ["month"],
          });
        }
      }

      if (data.preset === "yearly" || data.preset === "yearly-per-month") {
        if (data.year === undefined || data.year === null) {
          ctx.addIssue({
            code: "custom",
            message: "Year is required for yearly preset",
            path: ["year"],
          });
        }
      }
    }),
  tags: z.object({
    selectedTagIds: z.array(z.string()),
  }),
  budget: z.object({
    items: z
      .array(
        z
          .object({
            tagId: z.string().nullable(),
            categoryType: z.enum(["EXPENSE", "INCOME"]).nullable().optional(),
            expectedAmount: z.string(),
            monthlyAmounts: z.array(MonthlyAmountEntrySchema).optional(),
          })
          .refine(
            (item) => {
              if (item.tagId === null) {
                return (
                  item.categoryType !== null && item.categoryType !== undefined
                );
              }
              return (
                item.categoryType === null || item.categoryType === undefined
              );
            },
            {
              message:
                "categoryType is required when tagId is null; must be null when tagId is set",
            },
          ),
      )
      .min(1, "At least one budget item is required"),
  }),
})
  .superRefine((data, ctx) => {
    const preset = data.general.preset;
    if (preset === "yearly-per-month") {
      for (let i = 0; i < data.budget.items.length; i++) {
        const item = data.budget.items[i];
        const monthly = item.monthlyAmounts ?? [];
        if (monthly.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: BUDGET_AMOUNT_MIN_MESSAGE,
            path: ["budget", "items", i, "expectedAmount"],
          });
          continue;
        }
        let addedMasterBlankAggregate = false;

        for (let j = 0; j < monthly.length; j++) {
          const rawMa = monthly[j].expectedAmount;
          const monthHasOwn = String(rawMa ?? "").trim() !== "";
          const effective = monthHasOwn ? rawMa : item.expectedAmount;

          if (budgetAmountIsPositive(effective)) continue;

          if (monthHasOwn) {
            ctx.addIssue({
              code: "custom",
              message: BUDGET_AMOUNT_MIN_MESSAGE,
              path: [
                "budget",
                "items",
                i,
                "monthlyAmounts",
                j,
                "expectedAmount",
              ],
            });
          } else if (!addedMasterBlankAggregate) {
            ctx.addIssue({
              code: "custom",
              message: BUDGET_AMOUNT_MIN_MESSAGE,
              path: ["budget", "items", i, "expectedAmount"],
            });
            addedMasterBlankAggregate = true;
          }
        }
      }
      return;
    }

    for (let i = 0; i < data.budget.items.length; i++) {
      if (!budgetAmountIsPositive(data.budget.items[i].expectedAmount)) {
        ctx.addIssue({
          code: "custom",
          message: BUDGET_AMOUNT_MIN_MESSAGE,
          path: ["budget", "items", i, "expectedAmount"],
        });
      }
    }
  });

type IBudgetFormData = z.infer<typeof BudgetFormSchema>;

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extractTagIds(items: IBudgetItem[]): string[] {
  return items
    .map((item) => item.tagId)
    .filter((id): id is string => id !== null);
}

function transformBudgetToFormData(budget: IBudget): IBudgetFormData {
  const tagIds = extractTagIds(budget.items);
  const startDate = new Date(budget.startDate);
  const preset = budget.periodType as IBudgetPreset;

  return {
    general: {
      name: budget.name,
      startDate: budget.startDate.split("T")[0],
      endDate: budget.endDate.split("T")[0],
      currency: budget.currency,
      preset,
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1,
    },
    tags: {
      selectedTagIds: tagIds,
    },
    budget: {
      items: budget.items.map((item) => {
        if (preset === "yearly-per-month") {
          const monthlyAmounts = item.monthlyAmounts.map((ma) => ({
            year: ma.year,
            month: ma.month,
            expectedAmount: ma.expectedAmount,
          }));
          const firstAmount = monthlyAmounts[0]?.expectedAmount ?? "";
          return {
            tagId: item.tagId,
            categoryType: item.categoryType ?? undefined,
            expectedAmount: firstAmount,
            monthlyAmounts,
          };
        }

        // For simple presets, use the first monthly amount as the display value
        const firstAmount = item.monthlyAmounts[0]?.expectedAmount ?? "";
        return {
          tagId: item.tagId,
          categoryType: item.categoryType ?? undefined,
          expectedAmount: firstAmount,
          monthlyAmounts: undefined,
        };
      }),
    },
  };
}

function getEmptyFormValues(currency = DEFAULT_CURRENCY): IBudgetFormData {
  const preset = getCurrentYearPreset();
  return {
    general: {
      name: formatBudgetName("yearly-per-month", preset),
      startDate: formatLocalDate(preset.start),
      endDate: formatLocalDate(preset.end),
      currency,
      preset: "yearly-per-month",
      year: preset.start.getFullYear(),
      month: preset.start.getMonth() + 1,
    },
    tags: {
      selectedTagIds: [],
    },
    budget: {
      items: [],
    },
  };
}

function getGroupErrorMessages(
  groupErrors: FieldErrors<IBudgetFormData["tags"]> | undefined
): string[] {
  if (!groupErrors) return [];

  const messages: string[] = [];

  if (typeof groupErrors === "object") {
    Object.keys(groupErrors).forEach((key) => {
      const error = groupErrors[key as keyof typeof groupErrors];
      if (error && "message" in error && typeof error.message === "string") {
        messages.push(error.message);
      }
    });
  }

  return messages;
}

function transformFormDataToApiInput(
  data: IBudgetFormData
): ICreateBudgetInput | IUpdateBudgetInput {
  const preset = data.general.preset as IBudgetPreset;
  const periodType: IBudgetPeriodType = preset;
  const months = getBudgetMonthsFromDateStrings(
    data.general.startDate,
    data.general.endDate,
  );

  return {
    name: data.general.name,
    periodType,
    startDate: data.general.startDate,
    endDate: data.general.endDate,
    currency: data.general.currency,
    items: (data.budget.items ?? []).map((item) => {
      const categoryType =
        item.tagId === null ? item.categoryType ?? null : null;
      if (preset === "yearly-per-month") {
        return {
          tagId: item.tagId,
          categoryType,
          monthlyAmounts: (item.monthlyAmounts ?? []).map((ma) => ({
            year: ma.year,
            month: ma.month,
            expectedAmount: ma.expectedAmount,
          })),
        };
      }

      // For simple presets, replicate the single amount to all months
      return {
        tagId: item.tagId,
        categoryType,
        monthlyAmounts: months.map((m) => ({
          year: m.year,
          month: m.month,
          expectedAmount: item.expectedAmount,
        })),
      };
    }),
  };
}

export function BudgetCreateOrEditPage({
  budgetId,
}: IBudgetCreateOrEditPageProps) {
  const navigate = useNavigate();
  const workspaceId = useActiveWorkspaceId();
  const defaultCurrency = useDefaultCurrency(workspaceId);
  const workspaceRouteParam = workspaceIdToRouteParam(workspaceId);
  const isEditMode = !!budgetId;
  const { data: budget, isLoading: budgetLoading } = useBudget(budgetId ?? "");
  const { mutate: createBudget } = useCreateBudget();
  const { mutate: updateBudget } = useUpdateBudget();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState<ITabValue>(TABS[0]);

  const form = useFinForm<IBudgetFormData>({
    resolver: zodResolver(BudgetFormSchema),
    defaultValues: getEmptyFormValues(defaultCurrency),

  });

  const selectedTagIds = form.watch("tags.selectedTagIds");
  const hasUnsavedChanges = form.formState.isDirty;

  const blocker = useBlocker({
    shouldBlockFn: () => hasUnsavedChanges,
    withResolver: true,
    enableBeforeUnload: hasUnsavedChanges,
  });

  const tabState = useMemo(() => {
    const currentIndex = TABS.indexOf(currentTab);
    return {
      isFirstTab: currentIndex === 0,
      isLastTab: currentIndex === TABS.length - 1,
    };
  }, [currentTab]);

  const formErrors = useMemo(() => {
    const tagsErrors = getGroupErrorMessages(form.formState.errors.tags);
    return {
      tags: tagsErrors,
      hasGeneral: !!form.formState.errors.general,
      hasTags: tagsErrors.length > 0,
      hasBudget: !!form.formState.errors.budget,
    };
  }, [form.formState.errors]);

  const tabGroupRef = useRef<ITabGroupRef>(null);

  useEffect(() => {
    if (!isEditMode) {
      form.reset(getEmptyFormValues(defaultCurrency));
    }
  }, [isEditMode, form, defaultCurrency]);

  useEffect(() => {
    if (isEditMode && budget) {
      form.reset(transformBudgetToFormData(budget));
    }
  }, [isEditMode, budget, form]);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }

    if (isEditMode && budgetId) {
      navigate({
        to: "/$workspaceId/budgets/$budgetId",
        params: { workspaceId: workspaceRouteParam, budgetId },
      });
    } else {
      navigate({
        to: "/$workspaceId/budgets",
        params: { workspaceId: workspaceRouteParam },
      });
    }
  }, [hasUnsavedChanges, isEditMode, budgetId, navigate, workspaceId]);

  const handleDiscardChanges = useCallback(() => {
    if (isEditMode && budget) {
      form.reset(transformBudgetToFormData(budget));
    } else {
      form.reset(getEmptyFormValues());
    }

    setShowUnsavedDialog(false);

    if (isEditMode && budgetId) {
      navigate({
        to: "/$workspaceId/budgets/$budgetId",
        params: { workspaceId: workspaceRouteParam, budgetId },
        ignoreBlocker: true,
      });
    } else {
      navigate({
        to: "/$workspaceId/budgets",
        params: { workspaceId: workspaceRouteParam },
        ignoreBlocker: true,
      });
    }
  }, [isEditMode, budget, budgetId, form, navigate, workspaceId]);

  const showBlockerDialog = blocker.status === "blocked";
  const showUnsavedChangesPrompt = showUnsavedDialog || showBlockerDialog;

  const handleUnsavedDialogConfirm = useCallback(() => {
    if (showBlockerDialog && blocker.reset) {
      blocker.reset();
    }
    handleDiscardChanges();
  }, [showBlockerDialog, blocker, handleDiscardChanges]);

  const handleUnsavedDialogCancel = useCallback(() => {
    if (showBlockerDialog && blocker.reset) {
      blocker.reset();
    } else {
      setShowUnsavedDialog(false);
    }
  }, [showBlockerDialog, blocker]);

  const handleNext = useCallback(() => {
    tabGroupRef.current?.goNext();
  }, []);

  const handleTabBack = useCallback(() => {
    tabGroupRef.current?.goBack();
  }, []);

  const handleSubmit = useCallback(
    async (data: IBudgetFormData) => {
      setPending(true);

      const submitData = transformFormDataToApiInput(data);

      try {
        if (isEditMode && budgetId) {
          updateBudget(
            { budgetId, input: submitData as IUpdateBudgetInput },
            {
              onSuccess: (data) => {
                setPending(false);
                if (!isOfflineMutationPlaceholder(data)) {
                  toast.success("Budget updated successfully");
                }
                navigate({
                  to: "/$workspaceId/budgets/$budgetId",
                  params: { workspaceId: workspaceRouteParam, budgetId },
                  ignoreBlocker: true,
                });
              },
              onError: (error: Error) => {
                setPending(false);
                toast.error("Failed to update budget");
                console.error("Failed to update budget:", error);
              },
            }
          );
        } else {
          createBudget(submitData as ICreateBudgetInput, {
            onSuccess: (data) => {
              setPending(false);
              if (!isOfflineMutationPlaceholder(data)) {
                toast.success("Budget created successfully");
              }
              navigate({
                to: "/$workspaceId/budgets",
                params: { workspaceId: workspaceRouteParam },
                ignoreBlocker: true,
              });
            },
            onError: (error: Error) => {
              setPending(false);
              toast.error("Failed to create budget");
              console.error("Failed to create budget:", error);
            },
          });
        }
      } catch (err) {
        setPending(false);
        console.error("Unexpected error:", err);
        toast.error("An unexpected error occurred");
      }
    },
    [isEditMode, budgetId, createBudget, updateBudget, navigate, toast, workspaceId]
  );

  if (isEditMode && budgetLoading) {
    return (
      <Container>
        <Loading text="Loading budget" />
      </Container>
    );
  }

  if (isEditMode && !budget) {
    return (
      <Container>
        <EmptyPage
          icon={HiOutlineCurrencyEuro}
          emptyText="Budget not found"
          button={{
            buttonContent: "Back to budgets",
            clicked: handleBack,
          }}
        />
      </Container>
    );
  }

  return (
    <>
      <Form
        form={form}
        onSubmit={handleSubmit}
        className="flex flex-col min-h-full">
        <Container className="sticky top-0 z-10 bg-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconButton
                clicked={handleBack}
                ariaLabel={
                  isEditMode ? "Back to budget details" : "Back to budgets"
                }>
                <HiArrowLeft className="size-4" />
              </IconButton>
              <Title>
                {isEditMode
                  ? `Edit ${budget?.name ?? "Budget"}`
                  : "Create Budget"}
              </Title>
            </div>
          </div>
        </Container>

        <Container>
          <TabGroup
            ref={tabGroupRef}
            defaultValue={TABS[0]}
            tabs={TABS_ARRAY}
            onChangeTab={(previousTab, newTab) => {
              setCurrentTab(newTab as ITabValue);
            }}>
            <Tab
              value={TABS[0]}
              showWarning={formErrors.hasGeneral}>
              General
            </Tab>
            <TabContent value={TABS[0]}>
              <div className="space-y-6">
                <BudgetPresetSelector
                  onNameChange={(name) => form.setValue("general.name", name)}
                />
                <TextInput
                  name="general.name"
                  label="Budget Name"
                  disabled={pending}
                />
                <CurrencySelect
                  name="general.currency"
                  label="Currency"
                  disabled={pending}
                />
              </div>
            </TabContent>

            <Tab
              value={TABS[1]}
              showWarning={formErrors.hasTags}>
              Tags
            </Tab>
            <TabContent value={TABS[1]}>
              <div className="space-y-6">
                {formErrors.hasTags && (
                  <Alert
                    variant="danger"
                    title="Validation Errors">
                    {formErrors.tags.length === 1 && (
                      <p>{formErrors.tags[0]}</p>
                    )}
                  </Alert>
                )}
                <BudgetTagSelector name="tags.selectedTagIds" />
              </div>
            </TabContent>

            <Tab
              value={TABS[2]}
              showWarning={formErrors.hasBudget}>
              Budget
            </Tab>
            <TabContent value={TABS[2]}>
              <div className="space-y-6">
                <BudgetItemForm selectedTagIds={selectedTagIds} />
              </div>
            </TabContent>
          </TabGroup>
        </Container>

        <Container className="sticky bottom-0 bg-surface flex gap-2 justify-between mt-auto mb-0">
          {tabState.isFirstTab ? (
            <Button
              clicked={handleBack}
              disabled={pending}>
              Cancel
            </Button>
          ) : (
            <Button
              variant="default"
              disabled={pending}
              clicked={handleTabBack}>
              Back
            </Button>
          )}
          {tabState.isLastTab ? (
            <Button
              type="submit"
              variant="primary"
              disabled={pending}
              loading={{
                isLoading: pending,
                text: isEditMode ? "Updating budget" : "Creating budget",
              }}>
              {isEditMode ? "Update Budget" : "Create Budget"}
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={pending}
              clicked={handleNext}>
              Next
            </Button>
          )}
        </Container>
      </Form>

      <UnsavedChangesDialog
        open={showUnsavedChangesPrompt}
        onConfirm={handleUnsavedDialogConfirm}
        onCancel={handleUnsavedDialogCancel}
      />
    </>
  );
}
