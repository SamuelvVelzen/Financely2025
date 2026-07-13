import { useParams } from "@tanstack/react-router";
import { GuestJoinForm } from "@/features/split/components/guest-join-form";
import { Container } from "@/features/ui/container/container";

export function SplitGuestJoinPage() {
  const { token } = useParams({ from: "/splits/join/$token/" });
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Container className="w-full max-w-md">
        <p className="text-sm text-text-muted mb-2">Financely Splits</p>
        <h1 className="text-2xl font-bold text-text mb-6">Join group</h1>
        <GuestJoinForm token={token} />
      </Container>
    </div>
  );
}
