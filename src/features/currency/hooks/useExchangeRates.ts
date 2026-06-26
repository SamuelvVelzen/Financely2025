import { getExchangeRatesForDates } from "@/features/currency/api/client";
import {
  buildRatesByDateMap,
  type IRatesByDate,
} from "@/features/currency/services/conversion.service";
import type { IExchangeRatesResponse } from "@/features/currency/validation/schemas";
import { useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import { useMemo } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;

function isToday(dateKey: string): boolean {
  return dateKey === new Date().toISOString().slice(0, 10);
}

export function useExchangeRatesForDates(dates: string[]) {
  const uniqueDates = useMemo(
    () => [...new Set(dates.map((d) => d.slice(0, 10)))].sort(),
    [dates],
  );

  const query = useFinQuery<IExchangeRatesResponse, Error>({
    queryKey: queryKeys.exchangeRatesForDates(uniqueDates),
    queryFn: () => getExchangeRatesForDates(uniqueDates),
    enabled: uniqueDates.length > 0,
    staleTime: uniqueDates.some(isToday) ? DAY_MS : 7 * DAY_MS,
  });

  const ratesByDate: IRatesByDate = useMemo(() => {
    if (!query.data?.ratesByDate) {
      return {};
    }
    return buildRatesByDateMap(query.data.ratesByDate);
  }, [query.data]);

  return {
    ...query,
    ratesByDate,
  };
}
