import IconButton from "@/components/button/icon-button";
import Container from "@/components/container/container";
import EmptyContainer from "@/components/container/empty-container";
import Title from "@/components/typography/title";
import { HiArrowTrendingUp, HiPlus } from "react-icons/hi2";

export default function IncomesPage() {
  const incomes = [];

  return (
    <>
      <Container className="mb-4">
        <Title className="flex items-center justify-between">
          <div className="flex gap-2">
            <HiArrowTrendingUp />

            <span>Incomes</span>
          </div>

          <IconButton className={"text-xl"}>
            <HiPlus />
          </IconButton>
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
