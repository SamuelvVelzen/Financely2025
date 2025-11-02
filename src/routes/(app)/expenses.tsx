import Container from "@/features/ui/container/container";
import EmptyContainer from "@/features/ui/container/empty-container";
import Dropdown from "@/features/ui/dropdown/dropdown";
import DropdownItem from "@/features/ui/dropdown/dropdown-item";
import Title from "@/features/ui/typography/title";
import { createFileRoute } from "@tanstack/react-router";
import { HiArrowTrendingDown } from "react-icons/hi2";

export const Route = createFileRoute("/(app)/expenses")({
  component: ExpensesPage,
});

export default function ExpensesPage() {
  const expenses = [];

  return (
    <>
      <Container className="mb-4">
        <Title className="flex items-center justify-between">
          <div className="flex gap-2">
            <HiArrowTrendingDown />

            <span>Expenses</span>
          </div>

          <Dropdown>
            <DropdownItem icon={<HiArrowTrendingDown />}>
              Add expense
            </DropdownItem>
          </Dropdown>
        </Title>
      </Container>

      {expenses.length === 0 && (
        <EmptyContainer
          icon={<HiArrowTrendingDown />}
          emptyText={"No expenses yet. Start by adding your first expense."}
          button={{
            buttonText: "Add expense",
            // buttonAction: () => addExpense(),
          }}></EmptyContainer>
      )}

      {expenses.length > 0 && <Container>expenses</Container>}
    </>
  );
}
