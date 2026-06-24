import { TagRulesPanel } from "@/features/tag-rule/components/tag-rules-panel";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { Title } from "@/features/ui/typography/title";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { Link, useNavigate } from "@tanstack/react-router";
import { HiArrowLeft } from "react-icons/hi2";

export function SmartTaggingPage() {
  const navigate = useNavigate();
  const workspaceId = useNavWorkspaceId();
  const workspaceRouteParam = workspaceIdToRouteParam(workspaceId);

  const handleBack = () => {
    navigate({
      to: "/$workspaceId/tags",
      params: { workspaceId: workspaceRouteParam },
    });
  };

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface">
        <div className="flex items-center gap-2">
          <IconButton clicked={handleBack} ariaLabel="Back to tags">
            <HiArrowLeft className="size-4" />
          </IconButton>
          <Title>Smart tagging</Title>
        </div>
      </Container>

      <Container>
        <p className="text-text-muted">
          Suggest tags automatically when transaction names match your rules.
          Tags are never applied without your confirmation.{" "}
          <Link
            to="/account"
            hash="workspace-preferences"
            className="text-primary hover:underline">
            Workspace settings
          </Link>
        </p>
      </Container>

      <Container>
        <TagRulesPanel />
      </Container>

      <Container>
        <p className="text-sm text-text-muted">
          Smart tagging uses tags from your{" "}
          <Link
            to="/$workspaceId/tags"
            params={{ workspaceId: workspaceRouteParam }}
            className="text-primary hover:underline">
            tag list
          </Link>
          . Enable a preset to create missing tags with recommended colors and
          icons.
        </p>
      </Container>
    </>
  );
}
