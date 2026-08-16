import { WorkspaceSettingsStep } from "@/features/wizard/components/workspace-settings-step";
import { useCompleteWizard } from "@/features/wizard/hooks/useWizardProgress";
import { workspaceSetupWizardId } from "@/features/wizard/wizard-ids";
import { ResponsiveDialog } from "@/features/ui/dialog/responsive-dialog";
import { Text } from "@/features/ui/typography/text";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { Link } from "@tanstack/react-router";

export type IWorkspaceSetupDialogTarget = {
  id: IWorkspaceId;
  name: string;
};

export type IWorkspaceSetupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: IWorkspaceSetupDialogTarget | null;
};

export function WorkspaceSetupDialog({
  open,
  onOpenChange,
  workspace,
}: IWorkspaceSetupDialogProps) {
  const completeWizard = useCompleteWizard();

  const finish = async () => {
    if (workspace != null) {
      try {
        await completeWizard.mutateAsync(workspaceSetupWizardId(workspace.id));
      } catch {
        // Still close — settings may already be saved via auto-save
      }
    }
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          void finish();
          return;
        }
        onOpenChange(true);
      }}
      title={
        workspace?.name
          ? `Set up ${workspace.name}`
          : "Set up this workspace"
      }
      size="lg"
      content={
        <div className="space-y-4 p-1">
          <Text
            size="sm"
            isMuted>
            Choose the default currency and tagging preferences. You can change
            these anytime in Account.
          </Text>
          <WorkspaceSettingsStep
            workspaceId={workspace?.id ?? null}
            compact
          />
          <Text size="sm" isMuted>
            More preferences live in{" "}
            <Link
              to="/account"
              className="text-primary hover:underline"
              onClick={() => {
                void finish();
              }}>
              Account
            </Link>
            .
          </Text>
        </div>
      }
      footerButtons={[
        {
          buttonContent: "Skip",
          clicked: () => {
            void finish();
          },
        },
        {
          variant: "primary",
          buttonContent: "Done",
          clicked: () => {
            void finish();
          },
        },
      ]}
    />
  );
}
