import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Title } from "@/features/ui/typography/title";
import { HiArrowTrendingUp } from "react-icons/hi2";

export function IncomeOverview() {
  const incomes: unknown[] = [];

  return (
    <>
      <Container className="mb-4">
        <Title className="flex items-center justify-between">
          <div className="flex gap-2">
            <HiArrowTrendingUp />

            <span>Incomes</span>
          </div>

          <Dropdown>
            <DropdownItem icon={<HiArrowTrendingUp />}>Add income</DropdownItem>
          </Dropdown>
        </Title>
      </Container>
      {incomes.length === 0 && (
        <EmptyContainer
          icon={<HiArrowTrendingUp />}
          emptyText={
            " No income entries yet. Start by adding your first income source."
          }
          button={{
            buttonText: "Add income",
            buttonAction: () => {
              // TODO: Add income functionality
            },
          }}></EmptyContainer>
      )}

      {incomes.length > 0 && (
        <Container>
          <List data={incomes}>
            {(income: any) => (
              <ListItem>
                <div className="flex items-center gap-3">
                  <span className="text-text">{income.name}</span>
                  {income.description && (
                    <span className="text-sm text-text-muted">
                      {income.description}
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
