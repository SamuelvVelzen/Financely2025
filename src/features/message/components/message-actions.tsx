import type { IMessageAction } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { useMessageActions } from "../hooks/useMessageActions";

type IMessageActionsProps = {
  actions: IMessageAction[] | null;
  messageId: string;
};

export function MessageActions({ actions, messageId }: IMessageActionsProps) {
  const { handleAction } = useMessageActions();

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={
            action.variant === "primary"
              ? "primary"
              : action.variant === "danger"
                ? "danger"
                : "default"
          }
          size="sm"
          clicked={() => handleAction(action, messageId)}
          buttonContent={action.label}
        />
      ))}
    </div>
  );
}
