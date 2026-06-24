import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type { ISubscriptionCandidate } from "@/features/shared/validation/schemas";
import { detectSubscriptions } from "@/features/subscription/api/client";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import {
  useConfirmSubscription,
  useDismissCandidate,
} from "@/features/subscription/hooks/useSubscriptions";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { Loading } from "@/features/ui/loading";
import { useToast } from "@/features/ui/toast";
import { useCallback, useEffect, useState } from "react";
import { HiArrowPath } from "react-icons/hi2";
import { SubscriptionCandidateCard } from "./subscription-candidate-card";

type ISubscriptionDetectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type IDetectionState = {
  candidates: ISubscriptionCandidate[];
  isDetecting: boolean;
  hasDetected: boolean;
  confirmingName: string | null;
  dismissingName: string | null;
};

const emptyDetectionState = (): IDetectionState => ({
  candidates: [],
  isDetecting: false,
  hasDetected: false,
  confirmingName: null,
  dismissingName: null,
});

export function SubscriptionDetectionDialog({
  open,
  onOpenChange,
}: ISubscriptionDetectionDialogProps) {
  const workspaceId = useNavWorkspaceId();
  const toast = useToast();
  const { error: showDetectError } = toast;
  const { mutate: confirmSub } = useConfirmSubscription();
  const { mutate: dismissCandidate } = useDismissCandidate();

  const [detectionState, setDetectionState] = useState<IDetectionState>(
    emptyDetectionState,
  );
  const [prevOpen, setPrevOpen] = useState(open);
  const [detectionSession, setDetectionSession] = useState(0);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDetectionState({
        ...emptyDetectionState(),
        isDetecting: true,
      });
      setDetectionSession((session) => session + 1);
    }
  }

  const {
    candidates,
    isDetecting,
    hasDetected,
    confirmingName,
    dismissingName,
  } = detectionState;

  useEffect(() => {
    if (!open || !workspaceId) return;

    let cancelled = false;

    detectSubscriptions(workspaceId)
      .then((result) => {
        if (cancelled) return;
        setDetectionState((state) => ({
          ...state,
          candidates: result.candidates,
          hasDetected: true,
          isDetecting: false,
        }));
      })
      .catch(() => {
        if (cancelled) return;
        showDetectError("Failed to detect subscriptions");
        setDetectionState((state) => ({ ...state, isDetecting: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [open, workspaceId, detectionSession, showDetectError]);

  const handleConfirm = useCallback(
    (candidate: ISubscriptionCandidate) => {
      setDetectionState((state) => ({
        ...state,
        confirmingName: candidate.normalizedName,
      }));
      confirmSub(
        {
          name: candidate.displayName,
          type: candidate.type,
          amount: candidate.averageAmount,
          currency: candidate.currency,
          frequency: candidate.frequency,
          transactionIds: candidate.transactionIds,
        },
        {
          onSuccess: (data) => {
            setDetectionState((state) => {
              const remaining = state.candidates.filter(
                (c) => c.normalizedName !== candidate.normalizedName,
              );
              const allConfirmed = remaining.length === 0;

              if (allConfirmed) {
                onOpenChange(false);
              }
              if (!isOfflineMutationPlaceholder(data)) {
                if (allConfirmed) {
                  toast.success("All subscriptions confirmed");
                } else {
                  toast.success(
                    `"${candidate.displayName}" confirmed as subscription`,
                  );
                }
              }

              return {
                ...state,
                confirmingName: null,
                candidates: remaining,
              };
            });
          },
          onError: () => {
            toast.error("Failed to confirm subscription");
            setDetectionState((state) => ({
              ...state,
              confirmingName: null,
            }));
          },
        },
      );
    },
    [confirmSub, toast, onOpenChange],
  );

  const handleDismiss = useCallback(
    (candidate: ISubscriptionCandidate) => {
      setDetectionState((state) => ({
        ...state,
        dismissingName: candidate.normalizedName,
      }));
      dismissCandidate(
        {
          normalizedName: candidate.normalizedName,
          type: candidate.type,
        },
        {
          onSuccess: (data) => {
            setDetectionState((state) => {
              const remaining = state.candidates.filter(
                (c) => c.normalizedName !== candidate.normalizedName,
              );
              const noneLeft = remaining.length === 0;

              if (noneLeft) {
                onOpenChange(false);
              }
              if (!isOfflineMutationPlaceholder(data)) {
                toast.success("Candidate dismissed");
              }

              return {
                ...state,
                dismissingName: null,
                candidates: remaining,
              };
            });
          },
          onError: () => {
            toast.error("Failed to dismiss candidate");
            setDetectionState((state) => ({
              ...state,
              dismissingName: null,
            }));
          },
        },
      );
    },
    [dismissCandidate, toast, onOpenChange],
  );

  const dialogContent = isDetecting ? (
    <Loading text="Scanning transactions for recurring patterns..." />
  ) : hasDetected && candidates.length === 0 ? (
    <div className="flex flex-col items-center gap-4 py-8 text-text-muted">
      <div className="text-5xl border-4 p-2 rounded-full">
        <HiArrowPath className="size-8" />
      </div>
      <p className="text-center">
        No new subscriptions detected. Add more transactions and try again.
      </p>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm text-text-muted">
          {candidates.length} potential subscription
          {candidates.length > 1 ? "s" : ""} found. Confirm or dismiss each
          one.
        </p>
      </div>
      {candidates.map((candidate) => (
        <SubscriptionCandidateCard
          key={`${candidate.normalizedName}-${candidate.type}`}
          candidate={candidate}
          onConfirm={handleConfirm}
          onDismiss={handleDismiss}
          isConfirming={confirmingName === candidate.normalizedName}
          isDismissing={dismissingName === candidate.normalizedName}
        />
      ))}
    </div>
  );

  return (
    <Dialog
      title="Detect Subscriptions"
      content={dialogContent}
      open={open}
      onOpenChange={onOpenChange}
      dismissible={!confirmingName && !dismissingName}
      variant="modal"
      size="1/2"
      footerButtons={
        hasDetected && candidates.length === 0
          ? [
            {
              buttonContent: "Close",
              clicked: () => onOpenChange(false),
            },
          ]
          : undefined
      }
    />
  );
}
