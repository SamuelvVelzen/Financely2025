import Container from "@/components/container/container";
import Title from "@/components/typography/title";

export default function AccountPage() {
  return (
    <>
      <Container className="mb-4">
        <Title>Account</Title>
        <p className="text-text-muted">
          Manage your account settings and preferences.
        </p>
      </Container>

      <Container>
        <p className="text-text-muted text-center">
          Account settings will be available here.
        </p>
      </Container>
    </>
  );
}
