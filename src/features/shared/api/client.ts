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
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiClientError";
  }

  static fromResponse(response: IErrorResponse): ApiClientError {
    return new ApiClientError(
      response.error.code,
      response.error.message,
      400, // Default, should be extracted from actual response
      response.error.details as Record<string, unknown> | undefined
    );
  }
}

/**
 * Fetch wrapper with error normalization and JSON parsing
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // TODO: Add auth header injection here
  // const headers = new Headers(options?.headers);
  // headers.set("Authorization", `Bearer ${getToken()}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    // Try to parse as error response
    if (data && typeof data === "object" && "error" in data) {
      throw ApiClientError.fromResponse(data as IErrorResponse);
    }
    throw new ApiClientError(
      "UNKNOWN_ERROR",
      `Request failed with status ${response.status}`,
      response.status
    );
  }

  return data as T;
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
  return fetchApi<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return fetchApi<T>(endpoint, { method: "DELETE" });
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
