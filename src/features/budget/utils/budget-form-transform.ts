import {
  getMonthsInRange,
  type IYearMonth,
} from "@/features/budget/utils/budget-presets";

function parseLocalDate(dateStr: string): Date {
  const datePart = dateStr.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getBudgetMonthsFromDateStrings(
  startDate: string,
  endDate: string,
): IYearMonth[] {
  return getMonthsInRange(parseLocalDate(startDate), parseLocalDate(endDate));
}

export function alignMonthlyAmountsToMonths(
  months: IYearMonth[],
  formAmounts:
    | Array<{ year?: number; month?: number; expectedAmount?: string }>
    | undefined,
  fallbackAmount?: string,
): Array<{ year: number; month: number; expectedAmount: string }> {
  return months.map((m, i) => ({
    year: m.year,
    month: m.month,
    expectedAmount: formAmounts?.[i]?.expectedAmount ?? fallbackAmount ?? "",
  }));
}

function monthlyAmountsMatchMonths(
  months: IYearMonth[],
  formAmounts:
    | Array<{ year?: number; month?: number; expectedAmount?: string }>
    | undefined,
): boolean {
  if (!formAmounts || formAmounts.length !== months.length) return false;
  return months.every(
    (m, i) =>
      formAmounts[i]?.year === m.year && formAmounts[i]?.month === m.month,
  );
}

export interface IBudgetFormSyncAdapter {
  getValues: (name?: string) => unknown;
  setValue: (
    name: string,
    value: unknown,
    options?: { shouldValidate?: boolean },
  ) => void;
}

/** Re-align budget item monthlyAmounts year/month when start/end dates change. */
export function resyncBudgetItemMonthlyAmounts(
  form: IBudgetFormSyncAdapter,
): void {
  const preset = form.getValues("general.preset");
  if (preset !== "yearly-per-month") return;

  const start = form.getValues("general.startDate") as string;
  const end = form.getValues("general.endDate") as string;
  if (!start || !end) return;

  const currentMonths = getBudgetMonthsFromDateStrings(start, end);
  if (currentMonths.length === 0) return;

  const items = (form.getValues("budget.items") as unknown[]) ?? [];
  if (items.length === 0) return;

  let changed = false;
  const updatedItems = items.map((item: Record<string, unknown>) => {
    if (monthlyAmountsMatchMonths(currentMonths, item.monthlyAmounts)) {
      return item;
    }
    changed = true;
    return {
      ...item,
      monthlyAmounts: alignMonthlyAmountsToMonths(
        currentMonths,
        item.monthlyAmounts,
        item.expectedAmount,
      ),
    };
  });

  if (changed) {
    form.setValue("budget.items", updatedItems, { shouldValidate: false });
  }
}
