import IconButton from "@/components/button/icon-button";
import Container from "@/components/container/container";
import EmptyContainer from "@/components/container/empty-container";
import Title from "@/components/typography/title";
import { HiPlus, HiTag } from "react-icons/hi2";

export default function LabelsPage() {
  const labels = [];

  return (
    <>
      <Container className="mb-4">
        <Title className="flex items-center justify-between">
          <div className="flex gap-2">
            <HiTag />

            <span>Labels</span>
          </div>
          <IconButton className={"text-xl"}>
            <HiPlus />
          </IconButton>
        </Title>
      </Container>

      {labels.length === 0 && (
        <EmptyContainer
          icon={<HiTag />}
          emptyText={
            "No labels yet. Create your first label to organize your finances."
          }
          button={{
            buttonText: "Add label",
            // buttonAction: () => addExpense(),
          }}></EmptyContainer>
      )}

      {labels.length > 0 && <Container>labels</Container>}
    </>
  );
}
