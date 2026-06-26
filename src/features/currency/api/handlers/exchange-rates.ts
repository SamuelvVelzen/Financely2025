import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { ExchangeRateService } from "@/features/currency/services/exchange-rate.service";
import {
  ExchangeRatesResponseSchema,
} from "@/features/currency/validation/schemas";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/currency/exchange-rates
 * Query: ?date=YYYY-MM-DD or ?dates=YYYY-MM-DD,YYYY-MM-DD
 */
export async function GET({ request }: { request: Request }) {
  try {
    return await withAuth(async () => {
      const url = new URL(request.url);
      const dateParam = url.searchParams.get("date");
      const datesParam = url.searchParams.get("dates");

      let dates: string[] = [];
      if (datesParam) {
        dates = datesParam.split(",").map((d) => d.trim()).filter(Boolean);
      } else if (dateParam) {
        dates = [dateParam];
      } else {
        dates = [new Date().toISOString().slice(0, 10)];
      }

      const ratesByDate = await ExchangeRateService.getRatesForDates(dates);
      const response = ExchangeRatesResponseSchema.parse({ ratesByDate });
      return json(response);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
