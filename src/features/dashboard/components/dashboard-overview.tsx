import { BudgetSummaryCards } from "@/features/budget/components/overview/budget-summary-cards";
import { useBudgetsOverview } from "@/features/budget/hooks/useBudgets";
import { Container } from "@/features/ui/container/container";
import { Title } from "@/features/ui/typography/title";
import { HiOutlineChartBar } from "react-icons/hi2";

export function DashboardOverview() {
  const {
    data: overviewData,
    isLoading: isLoadingOverview,
    error: errorOverview,
  } = useBudgetsOverview();

  return (
    <>
      <Container>
        <Title className="flex items-center gap-2">
          <HiOutlineChartBar />
          Dashboard</Title>
        <p className="text-text-muted text-sm">
          Welcome to Financely. Manage your finances with ease.
        </p>
      </Container>

      <Container>
        <BudgetSummaryCards
          overviewData={overviewData}
          isLoading={isLoadingOverview}
          error={errorOverview}
        />
      </Container>
    </>
  );
}
