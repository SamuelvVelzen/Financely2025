import { Container } from "@/features/ui/container/container";
import { Title } from "@/features/ui/typography/title";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/messages")({
  component: MessagesPage,
  head: () => ({
    meta: [
      {
        title: "Messages | Financely",
      },
    ],
  }),
});

function MessagesPage() {
  return (
    <>
      <Container className="mb-4">
        <Title>Messages</Title>
        <p className="text-text-muted">
          View and manage your messages.
        </p>
      </Container>

      <Container>
        <div className="p-4 text-center text-text-muted">
          <p>No messages yet.</p>
        </div>
      </Container>
    </>
  );
}

