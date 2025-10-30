import Container from "@/components/container/container";
import Title from "@/components/typography/title";

export default function LabelsPage() {
  return (
    <>
      <Container className="mb-4">
        <Title>Labels</Title>
      </Container>
      <Container>
        <p className="text-text-muted text-center">
          No labels yet. Create your first label to organize your finances.
        </p>
      </Container>
    </>
  );
}
