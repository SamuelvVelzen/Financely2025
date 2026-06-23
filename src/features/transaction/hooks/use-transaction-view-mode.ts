import { TRANSACTION_VIEW_STORAGE_KEY_PREFIX } from "@/features/transaction/constants";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { workspaceIdToUrlSegment } from "@/features/workspace/workspace-id";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ITransactionLayoutMode = "list" | "table";

type ITransactionViewModeState = {
  layout: ITransactionLayoutMode;
  showDescriptions: boolean;
};

const DEFAULT_STATE: ITransactionViewModeState = {
  layout: "list",
  showDescriptions: true,
};

function getStorageKey(workspaceId: IWorkspaceId): string {
  return `${TRANSACTION_VIEW_STORAGE_KEY_PREFIX}.${workspaceIdToUrlSegment(workspaceId)}`;
}

function readStoredState(workspaceId: IWorkspaceId): ITransactionViewModeState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const raw = localStorage.getItem(getStorageKey(workspaceId));
    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<ITransactionViewModeState>;
    return {
      layout:
        parsed.layout === "table" || parsed.layout === "list"
          ? parsed.layout
          : DEFAULT_STATE.layout,
      showDescriptions:
        typeof parsed.showDescriptions === "boolean"
          ? parsed.showDescriptions
          : DEFAULT_STATE.showDescriptions,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeStoredState(
  workspaceId: IWorkspaceId,
  state: ITransactionViewModeState
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(state));
}

export function useTransactionViewMode(workspaceId: IWorkspaceId) {
  const [state, setState] = useState<ITransactionViewModeState>(() =>
    readStoredState(workspaceId)
  );

  useEffect(() => {
    setState(readStoredState(workspaceId));
  }, [workspaceId]);

  const setLayout = useCallback(
    (layout: ITransactionLayoutMode) => {
      setState((prev) => {
        const next = { ...prev, layout };
        writeStoredState(workspaceId, next);
        return next;
      });
    },
    [workspaceId]
  );

  const setShowDescriptions = useCallback(
    (showDescriptions: boolean) => {
      setState((prev) => {
        const next = { ...prev, showDescriptions };
        writeStoredState(workspaceId, next);
        return next;
      });
    },
    [workspaceId]
  );

  return useMemo(
    () => ({
      layout: state.layout,
      showDescriptions: state.showDescriptions,
      setLayout,
      setShowDescriptions,
    }),
    [state.layout, state.showDescriptions, setLayout, setShowDescriptions]
  );
}
