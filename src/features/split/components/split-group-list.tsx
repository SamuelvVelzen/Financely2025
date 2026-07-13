import { useSplitGroups } from "@/features/split/hooks/use-split-groups";
import type { ISplitGroupDialogTarget } from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { SplitGroupListItem } from "@/features/split/components/split-group-list-item";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { List } from "@/features/ui/list/list";
import { Loading } from "@/features/ui/loading";
import { useNavigate } from "@tanstack/react-router";
import { HiUsers } from "react-icons/hi2";

type ISplitGroupRow = ISplitGroupDialogTarget & {
  memberCount: number;
  role: string;
  isCreator: boolean;
  viewerNetAmount?: string;
};

export function SplitGroupList({
  onCreateClick,
  onEdit,
  onDelete,
}: {
  onCreateClick: () => void;
  onEdit?: (group: ISplitGroupDialogTarget) => void;
  onDelete?: (group: ISplitGroupDialogTarget) => void;
}) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useSplitGroups();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="Loading split groups" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-danger">
        Failed to load split groups
      </div>
    );
  }

  const groups: ISplitGroupRow[] = (data?.groups ?? []).map((group) => ({
    id: group.id as string,
    name: group.name as string,
    memberCount: group.memberCount as number,
    expenseCount: group.expenseCount as number,
    defaultCurrency: group.defaultCurrency as string,
    role: group.role as string,
    isCreator: group.isCreator as boolean,
    viewerNetAmount: group.viewerNetAmount as string | undefined,
  }));

  if (groups.length === 0) {
    return (
      <EmptyPage
        emptyText="No split groups yet. Create a group to track shared expenses with friends."
        icon={HiUsers}
        button={{
          buttonContent: "New group",
          clicked: onCreateClick,
        }}
      />
    );
  }

  return (
    <List data={groups}>
      {(group) => (
        <SplitGroupListItem
          key={group.id}
          group={group}
          canEdit={group.role === "admin"}
          onView={(g) =>
            navigate({ to: "/splits/$groupId", params: { groupId: g.id } })
          }
          onEdit={
            onEdit && group.role === "admin"
              ? () =>
                  onEdit({
                    id: group.id,
                    name: group.name,
                    defaultCurrency: group.defaultCurrency,
                    expenseCount: group.expenseCount,
                  })
              : undefined
          }
          onDelete={
            onDelete && group.isCreator
              ? () =>
                  onDelete({
                    id: group.id,
                    name: group.name,
                    defaultCurrency: group.defaultCurrency,
                    expenseCount: group.expenseCount,
                  })
              : undefined
          }
        />
      )}
    </List>
  );
}
