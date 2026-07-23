import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { Title } from "@/features/ui/typography/title";

export function SplitGuestInviteError({
  token,
  title,
  description,
  showJoinAgain = true,
}: {
  token: string;
  title: string;
  description: string;
  showJoinAgain?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Container className="w-full max-w-md space-y-4">
        <p className="text-sm text-text-muted">Financely Splits</p>
        <Title>{title}</Title>
        <p className="text-text-muted">{description}</p>
        {showJoinAgain ? (
          <Button
            variant="primary"
            className="w-full"
            clicked={() =>
              void navigate({
                to: "/splits/join/$token",
                params: { token },
              })
            }>
            Join again
          </Button>
        ) : null}
      </Container>
    </div>
  );
}
