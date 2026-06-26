import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { ExchangeRateService } from "@/features/currency/services/exchange-rate.service";
import { RefreshRatesResponseSchema } from "@/features/currency/validation/schemas";
import { getExchangeRateProvider } from "@/features/currency/services/providers/provider.factory";
import { json } from "@tanstack/react-start";

/**
 * POST /api/v1/currency/exchange-rates/refresh
 * Query: ?date=YYYY-MM-DD (optional, defaults to today)
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async () => {
      const url = new URL(request.url);
      const dateParam = url.searchParams.get("date");
      const date = dateParam
        ? new Date(`${dateParam}T00:00:00.000Z`)
        : new Date();

      const count = await ExchangeRateService.fetchAndStoreRates(date);
      const provider = getExchangeRateProvider();

      const response = RefreshRatesResponseSchema.parse({
        date: date.toISOString().slice(0, 10),
        baseCurrency: provider.getBaseCurrency(),
        count,
      });
      return json(response);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
