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
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HiArrowLeft, HiOutlineCurrencyEuro } from "react-icons/hi2";
import { z } from "zod";
import { BudgetItemForm } from "./budget-item-form";
import { BudgetPresetSelector } from "./budget-preset-selector";
import { BudgetTagSelector } from "./budget-tag-selector";

type IBudgetCreateOrEditPageProps = {
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
  }),
  budget: z.object({
    items: z
      .array(
        z.object({
          tagId: z.string().nullable(),
          expectedAmount: z
            .string({ error: "Expected amount is required" })
            .min(1, "Expected amount is required")
            .refine(
              (val) => {
                const num = parseFloat(val);
                return num > 0;
              },
              { message: "Expected amount must be greater than 0" }
            ),
        })
      )
      .min(1, "At least one budget item is required"),
  }),
});

type IBudgetFormData = z.infer<typeof BudgetFormSchema>;

/**
 * Format a date to YYYY-MM-DD string in local timezone
 * This avoids timezone conversion issues when using toISOString()
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const getEmptyFormValues = (): IBudgetFormData => {
  const preset = getCurrentMonthPreset();
  return {
    general: {
      name: formatBudgetName("monthly", preset),
      startDate: formatLocalDate(preset.start),
      endDate: formatLocalDate(preset.end),
      currency: "EUR",
      preset: "monthly" as const,
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
};

export function BudgetCreateOrEditPage({
  budgetId,
}: IBudgetCreateOrEditPageProps) {
  const navigate = useNavigate();
  const isEditMode = !!budgetId;
  const { data: budget, isLoading: budgetLoading } = useBudget(budgetId ?? "");
  const { mutate: createBudget } = useCreateBudget();
  const { mutate: updateBudget } = useUpdateBudget();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState("general");

  const form = useFinForm<IBudgetFormData>({
    resolver: zodResolver(BudgetFormSchema) as any,
    defaultValues: getEmptyFormValues(),
  });

  const selectedTagIds = form.watch("tags.selectedTagIds");
  const hasUnsavedChanges = form.formState.isDirty;

  // Define tab order
  const tabs = ["general", "tags", "budget"];
  const isFirstTab = currentTab === tabs[0];
  const isLastTab = currentTab === tabs[tabs.length - 1];

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
          }
        }
      });
    }

    return messages;
  };
  // Get error messages for each group
  const tagsErrors = getGroupErrorMessages(form.formState.errors.tags);

  // Check if each group has errors
  const hasGeneralErrors = !!form.formState.errors.general;
  const hasTagsErrors = tagsErrors.length > 0;
  const hasBudgetErrors = !!form.formState.errors.budget;

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
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }

    if (isEditMode && budgetId) {
      navigate({
        to: "/budgets/$budgetId",
        params: { budgetId },
      });
    } else {
      navigate({ to: ROUTES.BUDGETS });
    }
  };

  const handleDiscardChanges = () => {
    // Reset form to original values
    if (isEditMode && budget) {
      const tagIds = budget.items
        .map((item: { tagId: string | null }) => item.tagId)
        .filter((id: string | null): id is string => id !== null);

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
    } else {
      form.reset(getEmptyFormValues());
    }

    setShowUnsavedDialog(false);

    // Navigate after resetting
    if (isEditMode && budgetId) {
      navigate({
        to: "/budgets/$budgetId",
        params: { budgetId },
      });
    } else {
      navigate({ to: ROUTES.BUDGETS });
    }
  };

  // Ref to access TabGroup navigation methods
  const tabGroupRef = useRef<ITabGroupRef>(null);

  // Handler for Next button - navigates to next tab
  const handleNext = () => {
    tabGroupRef.current?.goNext();
  };

  // Handler for Back button - navigates to previous tab
  const handleTabBack = () => {
    tabGroupRef.current?.goBack();
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconButton
                clicked={handleBack}
                aria-label={
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
            defaultValue="general"
            tabs={tabs}
            onChangeTab={(previousTab, newTab) => {
              setCurrentTab(newTab);
            }}>
            <Tab
              value="general"
              showWarning={hasGeneralErrors}>
              General
            </Tab>
            <TabContent value="general">
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
              value="tags"
              showWarning={hasTagsErrors}>
              Tags
            </Tab>
            <TabContent value="tags">
              <div className="space-y-6">
                {hasTagsErrors && (
                  <Alert
                    variant="danger"
                    title="Validation Errors">
                    {tagsErrors.length === 1 && <p>{tagsErrors[0]}</p>}
                  </Alert>
                )}
                <BudgetTagSelector name="tags.selectedTagIds" />
              </div>
            </TabContent>

            <Tab
              value="budget"
              showWarning={hasBudgetErrors}>
              Budget
            </Tab>
            <TabContent value="budget">
              <div className="space-y-6">
                <BudgetItemForm selectedTagIds={selectedTagIds} />
              </div>
            </TabContent>
          </TabGroup>
        </Container>

        <Container className="sticky bottom-0 bg-surface flex gap-2 justify-between mt-auto mb-0">
          {isFirstTab ? (
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
          {isLastTab ? (
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
        open={showUnsavedDialog}
        onConfirm={handleDiscardChanges}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
}
