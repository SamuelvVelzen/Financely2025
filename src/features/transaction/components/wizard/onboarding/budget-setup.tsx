import { BudgetCreateOrEditPage } from "@/features/budget/components/create-or-edit/budget-create-or-edit";
import { useBudgets } from "@/features/budget/hooks/useBudgets";
import { formatDateRange } from "@/features/util/date/date-helpers";
import { Button } from "@/features/ui/button/button";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Spinner } from "@/features/ui/loading/spinner";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import { useState } from "react";
import { HiCheck, HiOutlineBanknotes, HiPlus } from "react-icons/hi2";

export function BudgetSetup() {
  const { data, isLoading } = useBudgets();
  const [isCreating, setIsCreating] = useState(false);

  const budgets = data?.data ?? [];
  const hasBudgets = budgets.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isCreating) {
    return (
      <div>
        <div className="text-center mb-6">
          <Title className="text-2xl mb-2">Create a budget</Title>
          <Text
            isMuted
            className="max-w-md mx-auto">
            Pick a period, choose tags, and set spending limits. You can refine
            this later.
          </Text>
        </div>
        <BudgetCreateOrEditPage
          embedded
          onEmbeddedSuccess={() => setIsCreating(false)}
          onEmbeddedCancel={() => setIsCreating(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <HiOutlineBanknotes className="size-8 text-primary" />
        </div>
        <Title className="text-2xl mb-2">Set a budget</Title>
        <Text
          isMuted
          className="max-w-md mx-auto">
          Budgets turn your tags into spending limits so you can see what&apos;s
          left each month. You can skip this and create one later.
        </Text>
      </div>

      {hasBudgets && (
        <div className="mb-6 p-4 bg-success/10 rounded-2xl border border-success/20">
          <div className="flex items-center gap-2">
            <HiCheck className="size-5 text-success shrink-0" />
            <Text className="font-medium">
              You have {budgets.length} budget
              {budgets.length !== 1 ? "s" : ""}
            </Text>
          </div>
        </div>
      )}

      {hasBudgets ? (
        <div className="mb-6 space-y-4">
          <div className="flex justify-end">
            <Button
              clicked={() => setIsCreating(true)}
              variant="primary"
              size="md"
              className="gap-2">
              <HiPlus className="size-4" />
              Create Another Budget
            </Button>
          </div>
          <List>
            {budgets.map((budget) => (
              <ListItem
                key={budget.id}
                className="py-3 justify-start">
                <div className="min-w-0 flex-1 text-left">
                  <Text className="font-medium truncate">{budget.name}</Text>
                  <Text
                    size="sm"
                    isMuted
                    className="mt-0.5">
                    {formatDateRange(budget.startDate, budget.endDate)} ·{" "}
                    {budget.items.length}{" "}
                    {budget.items.length === 1 ? "tag" : "tags"}
                  </Text>
                </div>
              </ListItem>
            ))}
          </List>
        </div>
      ) : (
        <div className="max-w-md mx-auto mb-8">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="group w-full flex flex-col items-center gap-4 p-6 rounded-2xl border border-border bg-surface hover:border-primary/50 hover:bg-primary/5 transition-all text-center cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <HiPlus className="size-6 text-primary" />
            </div>
            <div>
              <Text className="font-semibold mb-1">Create your first budget</Text>
              <Text
                isMuted
                size="sm">
                Choose tags and set monthly limits
              </Text>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
