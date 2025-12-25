"use client";

import { ROUTES } from "@/config/routes";
import {
  useBudget,
  useCreateBudget,
  useUpdateBudget,
} from "@/features/budget/hooks/useBudgets";
import {
  formatBudgetName,
  getCurrentMonthPreset,
} from "@/features/budget/utils/budget-presets";
import { CurrencySelect } from "@/features/currency/components/currency-select";
import {
  type ICreateBudgetInput,
  type IUpdateBudgetInput,
} from "@/features/shared/validation/schemas";
import { Alert } from "@/features/ui/alert/alert";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { Form } from "@/features/ui/form/form";
import { TextInput } from "@/features/ui/input/text-input";
import { Tab, TabContent, TabList, Tabs } from "@/features/ui/tab";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { HiArrowLeft } from "react-icons/hi2";
import { z } from "zod";
import { BudgetItemForm } from "./budget-item-form";
import { BudgetPresetSelector } from "./budget-preset-selector";
import { BudgetTagSelector } from "./budget-tag-selector";

type IBudgetFormPageProps = {
  budgetId?: string;
};

// Form-specific schema with nested groups (separate from API schema)
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
      preset: z.enum(["monthly", "yearly", "custom"]),
      year: z.number().optional(),
      month: z.number().optional(),
    })
    .superRefine((data, ctx) => {
      // Validate endDate is after or equal to startDate
      if (data.startDate && data.endDate) {
        if (new Date(data.endDate) < new Date(data.startDate)) {
          ctx.addIssue({
            code: "custom",
            message: "End date must be after or equal to start date",
            path: ["endDate"],
          });
        }
      }

      // Validate year/month based on preset
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

      if (data.preset === "yearly") {
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
    selectedTagIds: z.array(z.string()).min(1, "At least one tag is required"),
    includeMisc: z.boolean(),
  }),
  budget: z.object({
    items: z
      .array(
        z.object({
          tagId: z.string().nullable(),
          expectedAmount: z.string(),
        })
      )
      .min(1, "At least one budget item is required"),
  }),
});

type IBudgetFormData = z.infer<typeof BudgetFormSchema>;

const getEmptyFormValues = (): IBudgetFormData => {
  const preset = getCurrentMonthPreset();
  return {
    general: {
      name: formatBudgetName("monthly", preset),
      startDate: preset.start.toISOString().split("T")[0],
      endDate: preset.end.toISOString().split("T")[0],
      currency: "EUR",
      preset: "monthly" as const,
      year: preset.start.getFullYear(),
      month: preset.start.getMonth() + 1,
    },
    tags: {
      selectedTagIds: [],
      includeMisc: false,
    },
    budget: {
      items: [],
    },
  };
};

export function BudgetFormPage({ budgetId }: IBudgetFormPageProps) {
  const navigate = useNavigate();
  const isEditMode = !!budgetId;
  const { data: budget, isLoading: budgetLoading } = useBudget(budgetId ?? "");
  const { mutate: createBudget } = useCreateBudget();
  const { mutate: updateBudget } = useUpdateBudget();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  const form = useForm<IBudgetFormData>({
    resolver: zodResolver(BudgetFormSchema) as any,
    defaultValues: getEmptyFormValues(),
    mode: "onBlur", // Validate on blur to show errors before submit
  });

  const selectedTagIds = form.watch("tags.selectedTagIds");
  const includeMisc = form.watch("tags.includeMisc");

  // Helper function to extract error messages from a group
  const getGroupErrorMessages = (groupErrors: any): string[] => {
    if (!groupErrors) return [];

    const messages: string[] = [];

    if (typeof groupErrors === "object") {
      // Handle nested objects
      Object.keys(groupErrors).forEach((key) => {
        const error = groupErrors[key];
        if (error) {
          if (error.message) {
            messages.push(error.message);
          } else if (Array.isArray(error)) {
            // Handle array errors (like items array)
            error.forEach((itemError: any, index: number) => {
              if (itemError) {
                if (itemError.expectedAmount?.message) {
                  messages.push(
                    `Item ${index + 1}: ${itemError.expectedAmount.message}`
                  );
                } else if (typeof itemError === "object") {
                  Object.keys(itemError).forEach((field) => {
                    if (itemError[field]?.message) {
                      messages.push(
                        `Item ${index + 1} - ${field}: ${itemError[field].message}`
                      );
                    }
                  });
                }
              }
            });
          } else if (typeof error === "object") {
            // Recursively handle nested errors
            const nestedMessages = getGroupErrorMessages(error);
            messages.push(...nestedMessages);
          }
        }
      });
    }

    return messages;
  };

  // Get error messages for each group
  const generalErrors = getGroupErrorMessages(form.formState.errors.general);
  const tagsErrors = getGroupErrorMessages(form.formState.errors.tags);
  const budgetErrors = getGroupErrorMessages(form.formState.errors.budget);

  // Check if each group has errors
  const hasGeneralErrors = generalErrors.length > 0;
  const hasTagsErrors = tagsErrors.length > 0;
  const hasBudgetErrors = budgetErrors.length > 0;

  // Initialize form with default values in create mode
  useEffect(() => {
    if (!isEditMode) {
      form.reset(getEmptyFormValues());
    }
  }, [isEditMode, form]);

  // Populate form when budget loads (edit mode only)
  useEffect(() => {
    if (isEditMode && budget) {
      const tagIds = budget.items
        .map((item: { tagId: string | null }) => item.tagId)
        .filter((id: string | null): id is string => id !== null);
      const hasMisc = budget.items.some(
        (item: { tagId: string | null }) => item.tagId === null
      );

      form.reset({
        general: {
          name: budget.name,
          startDate: budget.startDate.split("T")[0],
          endDate: budget.endDate.split("T")[0],
          currency: budget.currency,
          preset: "custom",
          year: new Date(budget.startDate).getFullYear(),
          month: new Date(budget.startDate).getMonth() + 1,
        },
        tags: {
          selectedTagIds: tagIds,
          includeMisc: hasMisc,
        },
        budget: {
          items: budget.items.map(
            (item: { tagId: string | null; expectedAmount: string }) => ({
              tagId: item.tagId,
              expectedAmount: item.expectedAmount,
            })
          ),
        },
      });
    }
  }, [isEditMode, budget, form]);

  const handleBack = () => {
    if (isEditMode && budgetId) {
      navigate({
        to: "/budgets/$budgetId",
        params: { budgetId },
      });
    } else {
      navigate({ to: ROUTES.BUDGETS });
    }
  };

  const handleSubmit = async (data: IBudgetFormData) => {
    setPending(true);

    // Transform nested form data to flat API format
    // Dates are already transformed to ISO datetime strings by the schema
    const submitData: ICreateBudgetInput | IUpdateBudgetInput = {
      name: data.general.name,
      startDate: data.general.startDate,
      endDate: data.general.endDate,
      currency: data.general.currency,
      items: (data.budget.items ?? []).map((item) => ({
        tagId: item.tagId,
        expectedAmount: item.expectedAmount,
      })),
    };

    // Validate at least one item with amount > 0
    const hasValidItem = (submitData.items ?? []).some(
      (item: { expectedAmount: string }) => parseFloat(item.expectedAmount) > 0
    );
    if (!hasValidItem) {
      setPending(false);
      toast.error(
        "At least one budget item must have an amount greater than 0"
      );
      return;
    }

    try {
      if (isEditMode && budgetId) {
        updateBudget(
          { budgetId, input: submitData as IUpdateBudgetInput },
          {
            onSuccess: () => {
              setPending(false);
              toast.success("Budget updated successfully");
              navigate({
                to: "/budgets/$budgetId",
                params: { budgetId },
              });
            },
            onError: (error: Error) => {
              setPending(false);
              toast.error("Failed to update budget");
              throw error;
            },
          }
        );
      } else {
        createBudget(submitData as ICreateBudgetInput, {
          onSuccess: () => {
            setPending(false);
            toast.success("Budget created successfully");
            navigate({ to: ROUTES.BUDGETS });
          },
          onError: (error: Error) => {
            setPending(false);
            toast.error("Failed to create budget");
            throw error;
          },
        });
      }
    } catch (err) {
      setPending(false);
      throw err;
    }
  };

  if (isEditMode && budgetLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-text-muted">Loading budget...</div>
        </div>
      </Container>
    );
  }

  if (isEditMode && !budget) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-danger">Budget not found</div>
        </div>
      </Container>
    );
  }

  return (
    <Form
      form={form}
      onSubmit={handleSubmit}
      className="flex flex-col min-h-full">
      <Container className="sticky top-0 z-10 bg-surface mb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <IconButton
              clicked={handleBack}
              aria-label={
                isEditMode ? "Back to budget details" : "Back to budgets"
              }>
              <HiArrowLeft className="w-4 h-4" />
            </IconButton>
            <Title>
              {isEditMode
                ? `Edit ${budget?.name ?? "Budget"}`
                : "Create Budget"}
            </Title>
          </div>
        </div>
      </Container>

      <Container className="mb-4">
        <Tabs defaultValue="general">
          <TabList>
            <Tab
              value="general"
              showWarning={hasGeneralErrors}>
              General
            </Tab>
            <Tab
              value="tags"
              showWarning={hasTagsErrors}>
              Tags
            </Tab>
            <Tab
              value="budget"
              showWarning={hasBudgetErrors}>
              Budget
            </Tab>
          </TabList>

          <TabContent value="general">
            <div className="space-y-6">
              {hasGeneralErrors && (
                <Alert
                  variant="danger"
                  title="Validation Errors">
                  <ul className="list-disc list-inside space-y-1">
                    {generalErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}
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

          <TabContent value="tags">
            <div className="space-y-6">
              {hasTagsErrors && (
                <Alert
                  variant="danger"
                  title="Validation Errors">
                  <ul className="list-disc list-inside space-y-1">
                    {tagsErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              <BudgetTagSelector name="tags.selectedTagIds" />
            </div>
          </TabContent>

          <TabContent value="budget">
            <div className="space-y-6">
              {hasBudgetErrors && (
                <Alert
                  variant="danger"
                  title="Validation Errors">
                  <ul className="list-disc list-inside space-y-1">
                    {budgetErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              <BudgetItemForm
                selectedTagIds={selectedTagIds}
                includeMisc={includeMisc}
              />
            </div>
          </TabContent>
        </Tabs>
      </Container>

      <Container className="sticky bottom-0 bg-surface flex gap-2 justify-end mt-auto">
        <Button
          type="button"
          clicked={handleBack}
          disabled={pending}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={pending}>
          {pending
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
              ? "Update Budget"
              : "Create Budget"}
        </Button>
      </Container>
    </Form>
  );
}
