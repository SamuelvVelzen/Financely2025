import Container from "@/components/container/container";
import Title from "@/components/typography/title";
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
