import type { ITag } from "@/features/shared/validation/schemas";
import {
  normalizeFilterState,
  serializeFilterStateToQuery,
} from "./transaction-filter-model";
import type { ITransactionFilterQueryParams } from "./transaction-filter-query-schema";

export function buildTransactionSearchForTag(
  tag: ITag
): ITransactionFilterQueryParams {
  const params = serializeFilterStateToQuery(
    normalizeFilterState({
      tagFilter: [tag.id],
      transactionTypeFilter: [tag.transactionType],
    })
  );
  return params as ITransactionFilterQueryParams;
}
