import {
  GettingStarted,
  TagsSetup,
  TransactionSetup,
  WelcomePage,
} from "@/features/transaction/components/wizard/onboarding";
import { Loading } from "@/features/ui/loading";
import { IWizardPage, Wizard } from "@/features/ui/wizard/wizard";
import {
  useCompleteWizard,
  useUpdateWizardProgress,
  useWizardProgress,
} from "@/features/wizard/hooks/useWizardProgress";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { z } from "zod";

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

const searchSchema = z.object({
  step: z.string().optional(),
});

export const Route = createFileRoute("/(app)/onboarding")({
  component: OnboardingPage,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {
        title: "Welcome | Financely",
      },
    ],
  }),
});

function OnboardingPage() {
  const navigate = useNavigate({ from: "/onboarding" });
  const { step: urlStepId } = useSearch({ from: "/(app)/onboarding" });
  const { data: progress, isLoading } = useWizardProgress(WIZARD_ID);
  const updateProgress = useUpdateWizardProgress();
  const completeWizard = useCompleteWizard();

  const pages = useMemo(() => getOnboardingPages(), []);

  // Helper to get step index from page ID
  const getStepIndexById = (id: string | undefined): number => {
    if (!id) return 0;
    const index = pages.findIndex((p) => p.id === id);
    return index >= 0 ? index : 0;
  };

  // Helper to get page ID from step index
  const getStepIdByIndex = (index: number): string => {
    return pages[index]?.id ?? pages[0].id;
  };

  // Determine the current step - URL takes precedence, then saved progress, then 0
  const currentStep = urlStepId
    ? getStepIndexById(urlStepId)
    : progress?.currentStepIndex ?? 0;

  // Initialize URL with saved progress when first loading (if no step in URL)
  useEffect(() => {
    if (!isLoading && urlStepId === undefined && progress?.currentStepIndex) {
      const stepId = getStepIdByIndex(progress.currentStepIndex);
      navigate({
        search: { step: stepId },
        replace: true, // Don't add to history, just set initial state
      });
    }
  }, [isLoading, urlStepId, progress?.currentStepIndex, navigate, pages]);

  const handleStepChange = (stepIndex: number) => {
    const stepId = getStepIdByIndex(stepIndex);

    // Update URL with page ID (this enables browser back/forward)
    navigate({
      search: { step: stepId },
    });

    // Save progress to server
    updateProgress.mutate({
      wizardId: WIZARD_ID,
      currentStepIndex: stepIndex,
      totalSteps: pages.length,
    });
  };

  const handleComplete = async () => {
    await completeWizard.mutateAsync(WIZARD_ID);
    navigate({ to: "/" });
  };

  // Show loading state while fetching progress
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
