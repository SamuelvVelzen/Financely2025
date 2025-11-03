import { useTags } from "@/features/tags/hooks/useTags";
import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { Title } from "@/features/ui/typography/title";
import { createFileRoute } from "@tanstack/react-router";
import { HiOutlineTag } from "react-icons/hi2";

export const Route = createFileRoute("/(app)/labels")({
  component: LabelsPage,
});

export function LabelsPage() {
  const { data, isLoading, error } = useTags();
  const labels = data?.data ?? [];

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

      {isLoading && (
        <Container>
          <p className="text-text-muted text-center">Loading labels...</p>
        </Container>
      )}

      {error && (
        <Container>
          <p className="text-red-500 text-center">
            Error loading labels: {error.message}
          </p>
        </Container>
      )}

      {!isLoading && !error && labels.length === 0 && (
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

      {!isLoading && !error && labels.length > 0 && (
        <Container>
          <div className="space-y-2">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  {label.color && (
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: label.color }}
                    />
                  )}
                  <span className="text-text">{label.name}</span>
                  {label.description && (
                    <span className="text-sm text-text-muted">
                      {label.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      )}
    </>
  );
}
