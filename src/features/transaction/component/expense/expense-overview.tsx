import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Title } from "@/features/ui/typography/title";
import { HiArrowTrendingDown } from "react-icons/hi2";

export function ExpensesOverview() {
  const expenses: unknown[] = [];

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
            buttonAction: () => {
              // TODO: Add expense functionality
            },
          }}></EmptyContainer>
      )}

      {expenses.length > 0 && (
        <Container>
          <List data={expenses}>
            {(expense: any) => (
              <ListItem>
                <div className="flex items-center gap-3">
                  <span className="text-text">{expense.name}</span>
                  {expense.description && (
                    <span className="text-sm text-text-muted">
                      {expense.description}
                    </span>
                  )}
                </div>
              </ListItem>
            )}
          </List>
        </Container>
      )}
    </>
  );
}
