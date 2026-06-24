import { TagRulesPanel } from "@/features/tag-rule/components/tag-rules-panel";
import { Container } from "@/features/ui/container/container";
import { Title } from "@/features/ui/typography/title";
import { Link } from "@tanstack/react-router";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";

export function SmartTaggingPage() {
  const workspaceId = useNavWorkspaceId();
  const workspaceRouteParam = workspaceIdToRouteParam(workspaceId);

  return (
    <>
      <Container>
        <Title>Smart tagging</Title>
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
