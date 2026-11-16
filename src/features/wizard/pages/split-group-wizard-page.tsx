import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  getEmptySplitGroupFormValues,
  type ISplitGroupFormValues,
} from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { SplitGroupWizardDetailsStep } from "@/features/split/components/wizard/split-group-wizard-details-step";
import { SplitGroupWizardFxNote } from "@/features/split/components/wizard/split-group-wizard-fx-note";
import { SplitGroupWizardIntro } from "@/features/split/components/wizard/split-group-wizard-intro";
import { SplitGroupWizardMembersStep } from "@/features/split/components/wizard/split-group-wizard-members-step";
import { SplitGroupWizardReady } from "@/features/split/components/wizard/split-group-wizard-ready";
import {
  useCreateSplitGroup,
  useSplitGroup,
} from "@/features/split/hooks/use-split-groups";
import { Loading } from "@/features/ui/loading";
import { useToast } from "@/features/ui/toast";
import { type IWizardPage, Wizard } from "@/features/ui/wizard/wizard";
import {
  useCompleteWizard,
  useUpdateWizardProgress,
  useWizardProgress,
} from "@/features/wizard/hooks/useWizardProgress";
import { WIZARD_IDS } from "@/features/wizard/wizard-ids";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useDefaultCurrency } from "@/features/workspace/hooks/useWorkspaceSettings";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export function SplitGroupWizardPage() {
  const navigate = useNavigate({ from: "/wizards/split-group" });
  const { step: urlStepId } = useSearch({ from: "/(app)/wizards/split-group" });
  const { data: progress, isLoading } = useWizardProgress(
    WIZARD_IDS.SPLIT_GROUP,
  );
  const updateProgress = useUpdateWizardProgress();
  const completeWizard = useCompleteWizard();
  const workspaceId = useNavWorkspaceId();
  const defaultCurrency = useDefaultCurrency(workspaceId);
  const createGroup = useCreateSplitGroup();
  const toast = useToast();
  const formId = useId();

  const [groupId, setGroupId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ISplitGroupFormValues>(() =>
    getEmptySplitGroupFormValues(defaultCurrency),
  );
  const creatingRef = useRef(false);

  const { data: liveGroup } = useSplitGroup(groupId ?? "");

  const effectiveDraft = useMemo((): ISplitGroupFormValues => {
    if (groupId) {
      return draft;
    }
    return {
      ...draft,
      defaultCurrency,
    };
  }, [defaultCurrency, draft, groupId]);

  const ensureGroupCreated = useCallback(async (): Promise<string | null> => {
    if (groupId) {
      return groupId;
    }
    if (!effectiveDraft.name.trim()) {
      toast.error("Enter a group name to continue");
      return null;
    }
    if (creatingRef.current) {
      return null;
    }
    creatingRef.current = true;
    setCreateError(null);
    try {
      const created = await createGroup.mutateAsync({
        name: effectiveDraft.name.trim(),
        defaultCurrency: effectiveDraft.defaultCurrency || defaultCurrency,
      });
      if (isOfflineMutationPlaceholder(created)) {
        const offlineId =
          created &&
          typeof created === "object" &&
          "id" in created &&
          typeof (created as { id: unknown }).id === "string"
            ? (created as { id: string }).id
            : null;
        if (offlineId) {
          setGroupId(offlineId);
          return offlineId;
        }
        toast.error("Could not create group while offline");
        return null;
      }
      const id = created.id as string;
      setGroupId(id);
      toast.success("Group created");
      return id;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create group";
      setCreateError(message);
      toast.error(message);
      return null;
    } finally {
      creatingRef.current = false;
    }
  }, [createGroup, defaultCurrency, effectiveDraft, groupId, toast]);

  const pages = useMemo((): IWizardPage[] => {
    const members =
      (liveGroup?.members as Array<{
        id: string;
        displayName: string;
        status?: string;
        role?: string;
      }>) ?? [];
    const groupName =
      (liveGroup?.name as string | undefined) ?? effectiveDraft.name;
    const guestAccessToken = liveGroup?.guestAccessToken as string | undefined;
    const currentMemberId =
      (liveGroup?.currentMemberId as string | undefined) ?? "";
    const currentMemberRole =
      (liveGroup?.currentMemberRole as string | undefined) ?? "member";

    return [
      {
        id: "intro",
        content: <SplitGroupWizardIntro />,
        skippable: true,
      },
      {
        id: "details",
        content: (
          <SplitGroupWizardDetailsStep
            formId={formId}
            initialValues={effectiveDraft}
            disabled={createGroup.isPending}
            createError={createError}
            onValuesChange={(values) => {
              setDraft(values);
              if (createError) {
                setCreateError(null);
              }
            }}
            onSubmit={(values) => {
              setDraft(values);
            }}
          />
        ),
        skippable: false,
      },
      {
        id: "members",
        content: groupId ? (
          <SplitGroupWizardMembersStep
            groupId={groupId}
            groupName={groupName || "this group"}
            guestAccessToken={guestAccessToken}
            members={members}
            currentMemberId={currentMemberId}
            currentMemberRole={currentMemberRole}
          />
        ) : (
          <div className="flex justify-center py-12">
            <Loading text="Creating group" />
          </div>
        ),
        skippable: true,
      },
      {
        id: "fx",
        content: <SplitGroupWizardFxNote />,
        skippable: true,
      },
      {
        id: "ready",
        content: <SplitGroupWizardReady />,
        skippable: false,
      },
    ];
  }, [
    createError,
    createGroup.isPending,
    effectiveDraft,
    formId,
    groupId,
    liveGroup,
  ]);

  const getStepIndexById = (id: string | undefined): number => {
    if (!id) return 0;
    const index = pages.findIndex((p) => p.id === id);
    return index >= 0 ? index : 0;
  };

  const getStepIdByIndex = useCallback(
    (index: number): string => {
      return pages[index]?.id ?? pages[0].id;
    },
    [pages],
  );

  const currentStep = urlStepId
    ? getStepIndexById(urlStepId)
    : (progress?.currentStepIndex ?? 0);

  const currentStepId = getStepIdByIndex(currentStep);

  useEffect(() => {
    const stepsRequiringGroup = new Set(["members", "fx", "ready"]);
    if (!groupId && stepsRequiringGroup.has(currentStepId)) {
      navigate({
        search: { step: "details" },
        replace: true,
      });
    }
  }, [currentStepId, groupId, navigate]);

  useEffect(() => {
    if (!isLoading && urlStepId === undefined && progress?.currentStepIndex) {
      const stepId = getStepIdByIndex(progress.currentStepIndex);
      navigate({
        search: { step: stepId },
        replace: true,
      });
    }
  }, [
    isLoading,
    urlStepId,
    progress?.currentStepIndex,
    navigate,
    getStepIdByIndex,
  ]);

  const handleStepChange = async (stepIndex: number) => {
    const fromId = getStepIdByIndex(currentStep);
    const toId = getStepIdByIndex(stepIndex);

    if (fromId === "details" && stepIndex > currentStep) {
      const id = await ensureGroupCreated();
      if (!id) {
        return;
      }
    }

    navigate({
      search: { step: toId },
    });

    updateProgress.mutate({
      wizardId: WIZARD_IDS.SPLIT_GROUP,
      currentStepIndex: stepIndex,
      totalSteps: pages.length,
    });
  };

  const handleComplete = async () => {
    const id = groupId ?? (await ensureGroupCreated());
    await completeWizard.mutateAsync(WIZARD_IDS.SPLIT_GROUP);
    if (id) {
      navigate({
        to: "/splits/$groupId",
        params: { groupId: id },
      });
      return;
    }
    navigate({ to: "/splits" });
  };

  if (isLoading) {
    return (
      <Loading
        text="Loading"
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      />
    );
  }

  const isNextDisabled =
    currentStepId === "details" && (createGroup.isPending || !!createError);

  return (
    <Wizard
      pages={pages}
      currentStep={currentStep}
      onStepChange={(stepIndex) => {
        void handleStepChange(stepIndex);
      }}
      onComplete={() => {
        void handleComplete();
      }}
      onCancel={() => {
        navigate({ to: "/splits" });
      }}
      cancelLabel="Exit to splits"
      isNextDisabled={isNextDisabled}
    />
  );
}
