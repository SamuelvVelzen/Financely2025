import { isReplayableNetworkError } from "@/features/shared/offline/network-errors";
import { OfflineMutationQueuedError } from "@/features/shared/offline/offline-mutation-errors";
import {
  deserializeFormData,
  enqueueOfflineMutation,
  getOfflineOutboxUserId,
  type IOfflineFormDataField,
  type IOfflineMutationRecord,
} from "@/features/shared/offline/offline-mutation-outbox";
import {
  getIsOnline,
  reportNetworkFailure,
  reportNetworkSuccess,
} from "@/features/shared/offline/online-status-store";
import type { IErrorResponse } from "@/features/shared/validation/schemas";

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
      400,
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

function offlineSignInRequiredError(): ApiClientError {
  return new ApiClientError(
    "OFFLINE",
    "You are offline. Sign in to save changes on this device until you reconnect.",
    0,
  );
}

async function queueOfflineMutation(input: {
  method: IOfflineMutationRecord["method"];
  endpoint: string;
  body?: unknown;
  formData?: FormData;
}): Promise<never> {
  const userId = getOfflineOutboxUserId();
  if (!userId) {
    throw offlineSignInRequiredError();
  }
  const queued = await enqueueOfflineMutation({
    userId,
    method: input.method,
    endpoint: input.endpoint,
    body: input.body,
    formData: input.formData,
  });
  throw new OfflineMutationQueuedError(queued.id, queued.clientEntityId);
}

function shouldQueueBeforeRequest(): boolean {
  return typeof window !== "undefined" && !getIsOnline();
}

/**
 * Fetch wrapper with error normalization and JSON parsing (GET and reads)
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    const result = await parseJsonResponse<T>(response);
    reportNetworkSuccess();
    return result;
  } catch (error: unknown) {
    if (isReplayableNetworkError(error)) {
      reportNetworkFailure();
    }
    throw error;
  }
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

  if (!bypassOfflineGate && shouldQueueBeforeRequest()) {
    return queueOfflineMutation({ method, endpoint, body });
  }

  try {
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
    const result = await parseJsonResponse<T>(response);
    reportNetworkSuccess();
    return result;
  } catch (error: unknown) {
    if (!bypassOfflineGate && isReplayableNetworkError(error)) {
      reportNetworkFailure();
      return queueOfflineMutation({ method, endpoint, body });
    }
    throw error;
  }
}

/**
 * Multipart POST with offline outbox support (CSV uploads, etc.).
 */
export async function apiPostFormData<T>(
  endpoint: string,
  formData: FormData,
  init?: IFetchMutationInit,
): Promise<T> {
  const { bypassOfflineGate, ...rest } = init ?? {};
  const url = `${API_BASE_URL}${endpoint}`;

  if (!bypassOfflineGate && shouldQueueBeforeRequest()) {
    return queueOfflineMutation({
      method: "POST",
      endpoint,
      formData,
    });
  }

  try {
    const response = await fetch(url, {
      ...rest,
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const result = await parseJsonResponse<T>(response);
    reportNetworkSuccess();
    return result;
  } catch (error: unknown) {
    if (!bypassOfflineGate && isReplayableNetworkError(error)) {
      reportNetworkFailure();
      return queueOfflineMutation({
        method: "POST",
        endpoint,
        formData,
      });
    }
    throw error;
  }
}

function parseFormFieldsFromRecord(
  record: IOfflineMutationRecord,
): IOfflineFormDataField[] {
  if (!record.formFieldsJson) return [];
  try {
    const raw = JSON.parse(record.formFieldsJson) as unknown;
    return Array.isArray(raw) ? (raw as IOfflineFormDataField[]) : [];
  } catch {
    return [];
  }
}

/**
 * Replays one queued mutation (used by the offline processor only).
 */
export async function replayOfflineMutationFromRecord(
  record: IOfflineMutationRecord,
): Promise<unknown> {
  if (record.contentType === "multipart") {
    const fields = parseFormFieldsFromRecord(record);
    const formData = await deserializeFormData(fields);
    return apiPostFormData<unknown>(record.endpoint, formData, {
      bypassOfflineGate: true,
    });
  }

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
