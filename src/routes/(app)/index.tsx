import Container from "@/features/ui/container/container";
import Title from "@/features/ui/typography/title";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
  component: Home,
});

function Home() {
  return (
    <>
      <Container className="mb-4">
        <Title>Dashboard</Title>
      </Container>
      <Container>
        <p className="text-text-muted text-center">
          Account settings will be available here.
        </p>
      </Container>
    </>
  );
}
