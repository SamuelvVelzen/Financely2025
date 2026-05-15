import type { IErrorResponse } from "@/features/shared/validation/schemas";
import {
  enqueueOfflineMutation,
  getOfflineOutboxUserId,
  type IOfflineMutationRecord,
} from "@/features/shared/offline/offline-mutation-outbox";
import { getIsOnline } from "@/features/shared/offline/online-status-store";
import { OfflineMutationQueuedError } from "@/features/shared/offline/offline-mutation-errors";

/**
 * API Client Configuration
 */
const API_BASE_URL =
  typeof window !== "undefined" ? "/api/v1" : "http://localhost:3000/api/v1";

/**
 * API Error class for client-side
 */
export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }

  static fromResponse(response: IErrorResponse): ApiClientError {
    return new ApiClientError(
      response.error.code,
      response.error.message,
      400, // Default, should be extracted from actual response
      response.error.details as Record<string, unknown> | undefined,
    );
  }
}

export interface IFetchMutationInit extends RequestInit {
  bypassOfflineGate?: boolean;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json();

  if (!response.ok) {
    if (data && typeof data === "object" && "error" in data) {
      throw ApiClientError.fromResponse(data as IErrorResponse);
    }
    throw new ApiClientError(
      "UNKNOWN_ERROR",
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return data as T;
}

/**
 * Fetch wrapper with error normalization and JSON parsing (GET and reads)
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  return parseJsonResponse<T>(response);
}

/**
 * JSON mutation requests with offline outbox support.
 */
async function fetchJsonMutation<T>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body: unknown | undefined,
  init?: IFetchMutationInit,
): Promise<T> {
  const { bypassOfflineGate, ...rest } = init ?? {};
  const url = `${API_BASE_URL}${endpoint}`;

  if (
    typeof window !== "undefined" &&
    !bypassOfflineGate &&
    !getIsOnline()
  ) {
    const userId = getOfflineOutboxUserId();
    if (!userId) {
      throw new ApiClientError(
        "OFFLINE",
        "You are offline. Sign in to save changes on this device until you reconnect.",
        0,
      );
    }
    const queueId = await enqueueOfflineMutation({
      userId,
      method,
      endpoint,
      body,
    });
    throw new OfflineMutationQueuedError(queueId);
  }

  const response = await fetch(url, {
    ...rest,
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseJsonResponse<T>(response);
}

/**
 * Replays one queued mutation (used by the offline processor only).
 */
export async function replayOfflineMutationFromRecord(
  record: IOfflineMutationRecord,
): Promise<unknown> {
  return fetchJsonMutation<unknown>(
    record.endpoint,
    record.method,
    record.body,
    { bypassOfflineGate: true },
  );
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return fetchApi<T>(endpoint, { method: "GET" });
}

/**
 * POST request
 */
export async function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  return fetchJsonMutation<T>(endpoint, "POST", body);
}

/**
 * PUT request
 */
export async function apiPut<T>(endpoint: string, body?: unknown): Promise<T> {
  return fetchJsonMutation<T>(endpoint, "PUT", body);
}

/**
 * PATCH request
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: unknown,
): Promise<T> {
  return fetchJsonMutation<T>(endpoint, "PATCH", body);
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return fetchJsonMutation<T>(endpoint, "DELETE", undefined);
}

/**
 * Helper to convert Decimal strings to numbers for UI display only
 * Note: Keep as string for financial calculations to preserve precision
 */
export function decimalStringToNumber(decimalString: string): number {
  return parseFloat(decimalString);
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item));
      }
    } else {
      searchParams.append(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
