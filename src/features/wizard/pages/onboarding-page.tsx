import {
  GettingStarted,
  TagsSetup,
  TransactionSetup,
  WelcomePage,
} from "@/features/transaction/components/wizard/onboarding";
import { Loading } from "@/features/ui/loading";
import { type IWizardPage, Wizard } from "@/features/ui/wizard/wizard";
import {
  useCompleteWizard,
  useUpdateWizardProgress,
  useWizardProgress,
} from "@/features/wizard/hooks/useWizardProgress";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";

const WIZARD_ID = "onboarding";

function getOnboardingPages(): IWizardPage[] {
  return [
    {
      id: "welcome",
      content: <WelcomePage />,
    },
    {
      id: "tags-setup",
      content: <TagsSetup />,
    },
    {
      id: "transaction-setup",
      content: <TransactionSetup />,
    },
    {
      id: "ready",
      content: <GettingStarted />,
    },
  ];
}

export function OnboardingPage() {
  const navigate = useNavigate({ from: "/onboarding" });
  const { step: urlStepId } = useSearch({ from: "/(app)/onboarding" });
  const { data: progress, isLoading } = useWizardProgress(WIZARD_ID);
  const updateProgress = useUpdateWizardProgress();
  const completeWizard = useCompleteWizard();
  const workspaceId = useNavWorkspaceId();

  const pages = useMemo(() => getOnboardingPages(), []);

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
    : progress?.currentStepIndex ?? 0;

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

  const handleStepChange = (stepIndex: number) => {
    const stepId = getStepIdByIndex(stepIndex);

    navigate({
      search: { step: stepId },
    });

    updateProgress.mutate({
      wizardId: WIZARD_ID,
      currentStepIndex: stepIndex,
      totalSteps: pages.length,
    });
  };

  const handleComplete = async () => {
    await completeWizard.mutateAsync(WIZARD_ID);
    if (workspaceId != null) {
      navigate({
        to: "/$workspaceId",
        params: { workspaceId: workspaceIdToRouteParam(workspaceId) },
      });
      return;
    }
    navigate({ to: "/" });
  };

  if (isLoading) {
    return (
      <Loading text="Loading" className="fixed inset-0 z-50 flex items-center justify-center bg-background" />
    );
  }

  return (
    <Wizard
      pages={pages}
      currentStep={currentStep}
      onStepChange={handleStepChange}
      onComplete={handleComplete}
    />
  );
}
