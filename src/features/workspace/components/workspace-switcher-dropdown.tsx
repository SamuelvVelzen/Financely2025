import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { queryKeys } from "@/features/shared/query/keys";
import type { IWorkspaceSummary } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { dropdownRowBorderClasses } from "@/features/ui/dropdown/dropdown-item-classes";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { useToast } from "@/features/ui/toast";
import { Label } from "@/features/ui/typography/label";
import { useMe } from "@/features/users/hooks/useUser";
import { cn } from "@/features/util/cn";
import { AddOrEditWorkspaceDialog } from "@/features/workspace/components/add-or-edit-workspace-dialog";
import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useDeleteWorkspace } from "@/features/workspace/hooks/useWorkspaces";
import { buildWorkspaceNavigateTarget } from "@/features/workspace/utils/workspace-navigate-target";
import { markUserWorkspaceNavigation } from "@/features/workspace/utils/workspace-navigation-guard";
import {
  parseWorkspaceIdParam,
  workspaceIdToUrlSegment,
} from "@/features/workspace/workspace-id";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { HiBuildingOffice2, HiChevronDown, HiPencil, HiPlus, HiTrash } from "react-icons/hi2";

const MAX_WORKSPACES_ALLOWED = 5;

type IWorkspaceSwitcherDropdownProps = {
  className?: string;
  /** Icon-only trigger for tight layouts (e.g. mobile top nav). */
  compact?: boolean;
};

export function WorkspaceSwitcherDropdown({
  className,
  compact = false,
}: IWorkspaceSwitcherDropdownProps) {
  const { data: me } = useMe();
  const workspaceId = useNavWorkspaceId();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const deleteWorkspace = useDeleteWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<
    IWorkspaceSummary | undefined
  >();
  const [deleteTarget, setDeleteTarget] = useState<
    IWorkspaceSummary | undefined
  >();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const workspaces = useMemo(() => me?.workspaces ?? [], [me?.workspaces]);

  const options = useMemo(
    () =>
      workspaces.map((workspace) => ({
        workspace,
        value: workspaceIdToUrlSegment(workspace.id),
        label: workspace.name,
      })),
    [workspaces],
  );

  const currentSegment =
    workspaceId != null ? workspaceIdToUrlSegment(workspaceId) : "";

  const selectedLabel =
    options.find((o) => o.value === currentSegment)?.label ?? "Workspace";

  const navigateToWorkspace = useCallback(
    (targetWorkspaceId: number) => {
      const nextSeg = workspaceIdToUrlSegment(targetWorkspaceId);
      const target = buildWorkspaceNavigateTarget(pathname, targetWorkspaceId);
      if (target) {
        markUserWorkspaceNavigation();
        navigate({ to: target.to, params: target.params, replace: true });
      } else {
        window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, nextSeg);
      }
    },
    [navigate, pathname],
  );

  const handleSelectWorkspace = useCallback(
    (segment: string) => {
      const parsed = parseWorkspaceIdParam(segment);
      if (parsed == null || workspaceId == null || parsed === workspaceId) {
        return;
      }
      setIsOpen(false);
      navigateToWorkspace(parsed);
    },
    [workspaceId, navigateToWorkspace],
  );

  const handleWorkspaceCreated = useCallback(
    (created?: IWorkspaceSummary) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      setIsCreateDialogOpen(false);
      if (created) {
        navigateToWorkspace(created.id);
      }
    },
    [queryClient, navigateToWorkspace],
  );

  const handleCreateClick = () => {
    setIsOpen(false);
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (workspace: IWorkspaceSummary) => {
    setIsOpen(false);
    setEditingWorkspace(workspace);
  };

  const handleDeleteClick = (workspace: IWorkspaceSummary) => {
    setIsOpen(false);
    setDeleteTarget(workspace);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) {
      return;
    }

    const deletedId = deleteTarget.id;
    const isCurrentWorkspace = workspaceId === deletedId;
    const fallbackWorkspace = workspaces.find((w) => w.id !== deletedId);

    deleteWorkspace.mutate(deletedId, {
      onSuccess: (data) => {
        setIsDeleteDialogOpen(false);
        setDeleteTarget(undefined);
        if (!isOfflineMutationPlaceholder(data)) {
          toast.success("Workspace deleted successfully");
        }
        if (isCurrentWorkspace && fallbackWorkspace) {
          navigateToWorkspace(fallbackWorkspace.id);
        }
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to delete workspace",
        );
      },
    });
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeleteTarget(undefined);
  };

  if (options.length === 0) {
    return null;
  }

  const selectorButton = compact ? (
    <div className="size-8 rounded-full flex items-center justify-center shrink-0 border border-border bg-surface text-text-muted">
      <HiBuildingOffice2 className="size-4" aria-hidden="true" />
    </div>
  ) : (
    <>
      <span className="flex-1 text-left whitespace-nowrap truncate">
        {selectedLabel}
      </span>
      <HiChevronDown
        className={cn(
          "size-5 shrink-0 transition-transform duration-200 text-text-muted",
          isOpen && "rotate-180",
        )}
        aria-hidden="true"
      />
    </>
  );

  return (
    <div className={cn(compact ? "shrink-0" : "w-full", className)}>
      {compact ? (
        <Label className="sr-only">Switch workspace: {selectedLabel}</Label>
      ) : (
        <Label className="mb-1">Workspace</Label>
      )}
      <Dropdown
        dropdownSelector={selectorButton}
        open={isOpen}
        onOpenChange={setIsOpen}
        size={compact ? "sm" : "md"}
        selectorClassName={cn(
          "text-sm",
          compact &&
            "size-8 min-h-0 w-auto shrink-0 p-0 border-0 bg-transparent hover:bg-surface-hover rounded-full justify-center focus:ring-1 focus:ring-border",
          compact && isOpen && "ring-1 ring-border",
        )}>
        {options.map((option) => {
          const isSelected = option.value === currentSegment;

          return (
            <div
              key={option.value}
              className={cn(
                "group flex items-center gap-0.5 pr-1 hover:bg-surface-hover",
                dropdownRowBorderClasses,
                isSelected && "bg-primary/10 hover:bg-primary/20",
              )}>
              <Button
                className={cn(
                  "flex-1 min-w-0 gap-2 px-3 py-2 text-nowrap font-normal border-0 rounded-none justify-start focus:ring-0 bg-transparent hover:bg-transparent",
                  isSelected && "text-primary font-medium",
                )}
                clicked={() => handleSelectWorkspace(option.value)}>
                <span className="truncate">{option.label}</span>
              </Button>
              <IconButton
                size="xs"
                ariaLabel={`Edit ${option.label}`}
                className={cn(
                  "shrink-0 border-0 bg-transparent text-text-muted/35 transition-colors",
                  "group-hover:text-text-muted",
                  "hover:bg-surface-hover hover:text-text",

                )}
                clicked={() => handleEditClick(option.workspace)}>
                <HiPencil className="size-3.5" />
              </IconButton>
              <IconButton
                size="xs"
                ariaLabel={`Delete ${option.label}`}
                className={cn(
                  "shrink-0 border-0 bg-transparent text-text-muted/35 transition-colors",
                  "group-hover:text-danger",
                  "hover:bg-danger hover:text-white",
                )}
                clicked={() => handleDeleteClick(option.workspace)}>
                <HiTrash className="size-3.5" />
              </IconButton>
            </div>
          );
        })}
        {options.length < MAX_WORKSPACES_ALLOWED && (
          <Dropdown.Footer>
            <DropdownItem
              clicked={handleCreateClick}
              className="text-primary font-medium hover:bg-primary/10">
              <span className="flex items-center gap-2 w-full">
                <HiPlus className="size-4 shrink-0" aria-hidden="true" />
                Create new workspace
              </span>
            </DropdownItem>
          </Dropdown.Footer>
        )}
      </Dropdown>

      <AddOrEditWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleWorkspaceCreated}
      />

      <AddOrEditWorkspaceDialog
        open={editingWorkspace != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingWorkspace(undefined);
          }
        }}
        workspace={editingWorkspace}
        onSuccess={() => {
          setEditingWorkspace(undefined);
          void queryClient.invalidateQueries({ queryKey: queryKeys.me() });
        }}
      />

      <DeleteDialog
        title="Delete Workspace"
        content={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDeleteCancel();
          } else {
            setIsDeleteDialogOpen(true);
          }
        }}
        footerButtons={[
          {
            clicked: handleDeleteCancel,
            disabled: deleteWorkspace.isPending,
            buttonContent: "Cancel",
          },
          {
            clicked: handleDeleteConfirm,
            variant: "danger",
            disabled: deleteWorkspace.isPending,
            loading: {
              isLoading: deleteWorkspace.isPending,
              text: "Deleting workspace",
            },
            buttonContent: "Delete",
          },
        ]}
      />
    </div>
  );
}
