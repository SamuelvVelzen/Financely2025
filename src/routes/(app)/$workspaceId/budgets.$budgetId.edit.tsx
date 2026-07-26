import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BudgetEditPage } from "@/features/budget/pages/budget-edit-page";

const budgetEditSearchSchema = z.object({
  addTagId: z.string().min(1).optional(),
});

export const Route = createFileRoute("/(app)/$workspaceId/budgets/$budgetId/edit")({
  component: BudgetEditPage,
  validateSearch: (search: Record<string, unknown>) =>
    budgetEditSearchSchema.parse(search),
  head: () => ({
    meta: [
      {
        title: "Edit Budget | Financely",
      },
    ],
  }),
});
