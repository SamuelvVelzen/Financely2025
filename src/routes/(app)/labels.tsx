import Container from "@/components/container/container";
import EmptyContainer from "@/components/container/empty-container";
import Dropdown from "@/components/dropdown/dropdown";
import DropdownItem from "@/components/dropdown/dropdown-item";
import Title from "@/components/typography/title";
import { createFileRoute } from "@tanstack/react-router";
import { HiOutlineTag } from "react-icons/hi2";

export const Route = createFileRoute("/(app)/labels")({
  component: LabelsPage,
});

export default function LabelsPage() {
  const labels = [];

  return (
    <>
      <Container className="mb-4">
        <Title className="flex items-center justify-between">
          <div className="flex gap-2">
            <HiOutlineTag />

            <span>Labels</span>
          </div>

          <Dropdown>
            <DropdownItem icon={<HiOutlineTag />}>Add label</DropdownItem>
          </Dropdown>
        </Title>
      </Container>

      {labels.length === 0 && (
        <EmptyContainer
          icon={<HiOutlineTag />}
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
