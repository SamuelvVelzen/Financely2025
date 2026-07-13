import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Alert } from "@/features/ui/alert/alert";
import { TextInput } from "@/features/ui/input/text-input";
import { Button } from "@/features/ui/button/button";
import { apiPost } from "@/features/shared/api/client";

export function GuestJoinForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setPending(true);
    setError(null);
    try {
      await apiPost(`/splits/guest/${token}/join`, { displayName });
      await navigate({ to: "/splits/join/$token/view", params: { token } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <TextInput
        label="What's your name?"
        value={displayName}
        onChange={(v) => setDisplayName(String(v ?? ""))}
        placeholder="Sam"
      />
      {error ? (
        <Alert variant="danger">{error}</Alert>
      ) : null}
      <Button
        variant="primary"
        className="w-full"
        disabled={!displayName.trim() || pending}
        clicked={() => void handleJoin()}>
        Join group
      </Button>
    </div>
  );
}
