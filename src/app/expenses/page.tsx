import IconButton from "@/components/button/icon-button";
import Container from "@/components/container/container";
import EmptyContainer from "@/components/container/empty-container";
import Title from "@/components/typography/title";
import { HiArrowTrendingDown, HiPlus } from "react-icons/hi2";

export default function ExpensesPage() {
  const expenses = [];

  return (
    <>
      <Container className="mb-4">
        <Title className="flex items-center justify-between">
          <span>Expenses</span>

          <IconButton className={"text-xl"}>
            <HiPlus />
          </IconButton>
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
