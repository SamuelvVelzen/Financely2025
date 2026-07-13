import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { HiPlus } from "react-icons/hi2";

type IMember = {
  id: string;
  displayName: string;
  status?: string;
};

export function SplitMembersSection({
  members,
  onAddMember,
}: {
  members: IMember[];
  onAddMember: () => void;
}) {
  return (
    <Container className="mb-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-text">People</h2>
        <Button variant="secondary" size="xs" clicked={onAddMember}>
          <HiPlus className="size-4" /> Add person
        </Button>
      </div>
      <ul className="space-y-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-2 text-sm">
            <span className="text-text">{member.displayName}</span>
            {member.status === "pending" ? (
              <span className="text-xs text-text-muted">Invited</span>
            ) : null}
          </li>
        ))}
      </ul>
    </Container>
  );
}
