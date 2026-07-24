/**
 * Notification Filter Model
 *
 * Canonical filter state for notification filtering, with normalization
 * and URL serialization utilities (same pattern as transactions).
 */

import type { INotificationType } from "@/features/shared/validation/enums";
import type {
  INotificationFilterQueryParams,
  INotificationStatusFilter,
} from "./notification-filter-query-schema";

export interface INotificationFilterState {
  /**
   * Read-status filter
   * - "all" means unset (show all)
   * - "unread" / "read" means filtered
   */
  status: INotificationStatusFilter;

  /**
   * Notification type filter
   * - undefined means unset (show all types)
   * - otherwise filter to that type
   */
  type: INotificationType | undefined;
}

export const DEFAULT_NOTIFICATION_FILTER_STATE: INotificationFilterState = {
  status: "all",
  type: undefined,
};

const VALID_STATUSES: INotificationStatusFilter[] = ["all", "unread", "read"];
const VALID_TYPES: INotificationType[] = [
  "INFO",
  "SUCCESS",
  "WARNING",
  "ERROR",
];

function normalizeStatus(
  status: INotificationStatusFilter | undefined,
): INotificationStatusFilter {
  if (status && VALID_STATUSES.includes(status)) {
    return status;
  }
  return DEFAULT_NOTIFICATION_FILTER_STATE.status;
}

function normalizeType(
  type: INotificationType | undefined,
): INotificationType | undefined {
  if (type && VALID_TYPES.includes(type)) {
    return type;
  }
  return undefined;
}

export function normalizeFilterState(
  state: Partial<INotificationFilterState>,
): INotificationFilterState {
  return {
    status: normalizeStatus(state.status),
    type: normalizeType(state.type),
  };
}

export function areFilterStatesEqual(
  a: INotificationFilterState,
  b: INotificationFilterState,
): boolean {
  return a.status === b.status && a.type === b.type;
}

export function hasActiveFilters(
  state: INotificationFilterState,
  defaultState: INotificationFilterState = DEFAULT_NOTIFICATION_FILTER_STATE,
): boolean {
  return state.status !== defaultState.status || state.type !== undefined;
}

/**
 * Serialize filter state to URL query parameters.
 * Defaults are omitted so clean URLs stay short.
 */
export function serializeFilterStateToQuery(
  state: INotificationFilterState,
): INotificationFilterQueryParams {
  return {
    status: state.status === "all" ? undefined : state.status,
    type: state.type,
  };
}

/**
 * Deserialize URL search params into a partial filter state.
 */
export function deserializeFilterStateFromQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): Partial<INotificationFilterState> {
  const state: Partial<INotificationFilterState> = {};

  const getParam = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    const value = params[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const status = getParam("status");
  if (status && VALID_STATUSES.includes(status as INotificationStatusFilter)) {
    state.status = status as INotificationStatusFilter;
  }

  const type = getParam("type");
  if (type && VALID_TYPES.includes(type as INotificationType)) {
    state.type = type as INotificationType;
  }

  return state;
}

/**
 * Map UI filter state to API list query fields.
 */
export function filterStateToApiQuery(state: INotificationFilterState): {
  read: boolean | undefined;
  type: INotificationType | undefined;
} {
  const read =
    state.status === "unread"
      ? false
      : state.status === "read"
        ? true
        : undefined;

  return {
    read,
    type: state.type,
  };
}
