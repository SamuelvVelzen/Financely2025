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
  CreateBudgetInputSchema,
  UpdateBudgetInputSchema,
  type ICreateBudgetInput,
  type IUpdateBudgetInput,
} from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { Form } from "@/features/ui/form/form";
import { DateInput } from "@/features/ui/input/date-input";
import { TextInput } from "@/features/ui/input/text-input";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { HiArrowLeft } from "react-icons/hi2";
import { z } from "zod";
import { BudgetItemForm } from "../budget-item-form";
import { BudgetPresetSelector } from "../budget-preset-selector";
import { BudgetTagSelector } from "../budget-tag-selector";

type IBudgetFormPageProps = {
  budgetId?: string;
};

const getEmptyFormValues = () => {
  const preset = getCurrentMonthPreset();
  return {
    name: formatBudgetName("monthly", preset),
    startDate: preset.start.toISOString().split("T")[0],
    endDate: preset.end.toISOString().split("T")[0],
    currency: "USD",
    items: [],
    preset: "monthly" as const,
    selectedTagIds: [] as string[],
    includeMisc: false,
    year: preset.start.getFullYear(),
    month: preset.start.getMonth() + 1,
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

  const form = useForm<
    z.infer<typeof CreateBudgetInputSchema> & {
      preset?: "monthly" | "yearly" | "custom";
      selectedTagIds?: string[];
      includeMisc?: boolean;
      year?: number;
      month?: number;
    }
  >({
    resolver: zodResolver(
      isEditMode ? UpdateBudgetInputSchema : CreateBudgetInputSchema
    ) as any,
    defaultValues: getEmptyFormValues(),
  });

  const selectedTagIds = form.watch("selectedTagIds") as string[] | undefined;
  const includeMisc = form.watch("includeMisc") as boolean | undefined;

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
        name: budget.name,
        startDate: budget.startDate.split("T")[0],
        endDate: budget.endDate.split("T")[0],
        currency: budget.currency,
        items: budget.items.map(
          (item: { tagId: string | null; expectedAmount: string }) => ({
            tagId: item.tagId,
            expectedAmount: item.expectedAmount,
          })
        ),
        preset: "custom",
        selectedTagIds: tagIds,
        includeMisc: hasMisc,
        year: new Date(budget.startDate).getFullYear(),
        month: new Date(budget.startDate).getMonth() + 1,
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

  const handleSubmit = async (data: any) => {
    setPending(true);

    // Transform form data to API format
    // Dates are already transformed to ISO datetime strings by the schema
    const submitData: ICreateBudgetInput | IUpdateBudgetInput = {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      currency: data.currency,
      items: (data.items ?? []).map((item: any) => ({
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
    <>
      <Container className="sticky top-0 z-10 bg-surface mb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              clicked={handleBack}
              aria-label={
                isEditMode ? "Back to budget details" : "Back to budgets"
              }>
              <HiArrowLeft className="w-4 h-4" />
            </Button>
            <Title>{isEditMode ? "Edit Budget" : "Create Budget"}</Title>
          </div>
        </div>
      </Container>

      <Container>
        {/* Form */}
        <Form
          form={form}
          onSubmit={handleSubmit}>
          <div className="space-y-6">
            <BudgetPresetSelector
              onNameChange={(name) => form.setValue("name", name)}
            />
            <TextInput
              name="name"
              label="Budget Name"
              disabled={pending}
            />
            <CurrencySelect
              name="currency"
              label="Currency"
              disabled={pending}
            />
            <div className="grid grid-cols-2 gap-4">
              <DateInput
                name="startDate"
                label="Start Date"
                disabled={pending || form.watch("preset") !== "custom"}
              />
              <DateInput
                name="endDate"
                label="End Date"
                disabled={pending || form.watch("preset") !== "custom"}
              />
            </div>
            <BudgetTagSelector name="selectedTagIds" />
            <BudgetItemForm
              selectedTagIds={selectedTagIds ?? []}
              includeMisc={includeMisc ?? false}
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
              <Button
                type="button"
                variant="secondary"
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
            </div>
          </div>
        </Form>
      </Container>
    </>
  );
}
