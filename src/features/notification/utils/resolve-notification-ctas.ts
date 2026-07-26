import type {
  INotification,
  INotificationAction,
} from "@/features/shared/validation/schemas";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { workspaceIdToUrlSegment } from "@/features/workspace/workspace-id";
import {
  isNotificationRelatedType,
  NOTIFICATION_RELATED_TYPE,
  type INotificationRelatedType,
} from "./notification-related-type";

export type INotificationCta = {
  label: string;
  path: string;
};

const CTA_BY_RELATED_TYPE: Record<
  INotificationRelatedType,
  { label: string; pathSuffix: string }
> = {
  [NOTIFICATION_RELATED_TYPE.subscription]: {
    label: "Review subscriptions",
    pathSuffix: "subscriptions",
  },
  [NOTIFICATION_RELATED_TYPE.import]: {
    label: "View transactions",
    pathSuffix: "transactions",
  },
  [NOTIFICATION_RELATED_TYPE.transactions]: {
    label: "View transactions",
    pathSuffix: "transactions",
  },
  [NOTIFICATION_RELATED_TYPE.budget]: {
    label: "View budgets",
    pathSuffix: "budgets",
  },
};

function ctaForRelatedType(
  relatedType: INotificationRelatedType,
  workspaceId: IWorkspaceId,
  relatedId: string | null | undefined,
): INotificationCta {
  const meta = CTA_BY_RELATED_TYPE[relatedType];
  const basePath = `/${workspaceIdToUrlSegment(workspaceId)}/${meta.pathSuffix}`;

  if (
    relatedType === NOTIFICATION_RELATED_TYPE.budget &&
    relatedId
  ) {
    return {
      label: "View budget",
      path: `${basePath}/${relatedId}`,
    };
  }

  return {
    label: meta.label,
    path: basePath,
  };
}

function legacyCtasFromStoredActions(
  actions: INotificationAction[] | null,
): INotificationCta[] {
  if (!actions?.length) {
    return [];
  }
  return actions.flatMap((action) => {
    if (action.type !== "navigate" || !action.path) {
      return [];
    }
    return [{ label: action.label, path: action.path }];
  });
}

/**
 * Resolve notification CTAs from relatedType (preferred).
 * Falls back to stored navigate actions for older rows.
 */
export function resolveNotificationCtas(
  notification: Pick<INotification, "relatedType" | "relatedId" | "actions">,
  workspaceId: IWorkspaceId,
): INotificationCta[] {
  if (isNotificationRelatedType(notification.relatedType)) {
    return [
      ctaForRelatedType(
        notification.relatedType,
        workspaceId,
        notification.relatedId,
      ),
    ];
  }
  return legacyCtasFromStoredActions(notification.actions);
}
