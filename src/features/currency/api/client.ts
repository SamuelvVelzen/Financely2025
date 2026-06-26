import { apiGet, apiPost } from "@/features/shared/api/client";
import type {
  IExchangeRatesResponse,
  IRefreshRatesResponse,
  IWorkspaceCurrenciesResponse,
} from "@/features/currency/validation/schemas";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";

export async function getExchangeRates(
  date?: string,
): Promise<IExchangeRatesResponse> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiGet<IExchangeRatesResponse>(`/currency/exchange-rates${query}`);
}

export async function getExchangeRatesForDates(
  dates: string[],
): Promise<IExchangeRatesResponse> {
  if (dates.length === 0) {
    return { ratesByDate: [] };
  }
  const unique = [...new Set(dates)].sort();
  const query = `?dates=${encodeURIComponent(unique.join(","))}`;
  return apiGet<IExchangeRatesResponse>(`/currency/exchange-rates${query}`);
}

export async function refreshExchangeRates(
  date?: string,
): Promise<IRefreshRatesResponse> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiPost<IRefreshRatesResponse>(
    `/currency/exchange-rates/refresh${query}`,
  );
}

export async function getWorkspaceCurrencies(
  workspaceId: IWorkspaceId,
): Promise<IWorkspaceCurrenciesResponse> {
  const param = workspaceIdToRouteParam(workspaceId);
  return apiGet<IWorkspaceCurrenciesResponse>(`/${param}/currencies`);
}
