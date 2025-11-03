import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { Title } from "@/features/ui/typography/title";
import { createFileRoute } from "@tanstack/react-router";
import { HiArrowTrendingUp } from "react-icons/hi2";

export const Route = createFileRoute("/(app)/incomes")({
  component: IncomesPage,
});

export function IncomesPage() {
  const incomes = [];

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
            // buttonAction: () => addExpense(),
          }}></EmptyContainer>
      )}

      {incomes.length > 0 && <Container>incomes</Container>}
    </>
  );
}
