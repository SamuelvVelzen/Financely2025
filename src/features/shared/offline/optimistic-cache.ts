import type {
  ICreateBudgetInput,
  ICreateNotificationInput,
  ICreateTagInput,
  ICreateTransactionInput,
  INotification,
  ISubscription,
  ITag,
  ITransaction,
  IUpdateTransactionInput,
  IUserResponse,
  IWorkspaceSummary,
} from "@/features/shared/validation/schemas";
import type { ICreateTagRuleInput, ITagRule } from "@/features/tag-rule/validation/schemas";
import type { IBudget } from "@/features/shared/validation/schemas";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";

export type IQuerySnapshot = Array<[readonly unknown[], unknown]>;

const nowIso = () => new Date().toISOString();

export async function cancelAndSnapshot<T>(
  queryClient: QueryClient,
  queryKeyPrefix: readonly unknown[],
): Promise<IQuerySnapshot> {
  await queryClient.cancelQueries({ queryKey: queryKeyPrefix });
  return queryClient.getQueriesData<T>({
    queryKey: queryKeyPrefix,
  }) as IQuerySnapshot;
}

export function restoreSnapshot(
  queryClient: QueryClient,
  snapshot: IQuerySnapshot | readonly (readonly [readonly unknown[], unknown])[] | undefined,
): void {
  for (const [key, data] of snapshot ?? []) {
    queryClient.setQueryData([...key], data);
  }
}

type IPaginated<T> = { data: T[]; total?: number };
type IDataList<T> = { data: T[] };

export function mapPaginatedQueries<T extends IPaginated<U>, U>(
  queryClient: QueryClient,
  queryKeyPrefix: readonly unknown[],
  mapItems: (items: U[]) => U[],
): void {
  queryClient.setQueriesData<T>({ queryKey: queryKeyPrefix }, (old) => {
    if (!old?.data) return old;
    const nextData = mapItems(old.data);
    const added = nextData.length - old.data.length;
    return {
      ...old,
      data: nextData,
      total: old.total !== undefined ? Math.max(0, old.total + added) : old.total,
    };
  });
}

export function mapDataListQueries<T extends IDataList<U>, U>(
  queryClient: QueryClient,
  queryKeyPrefix: readonly unknown[],
  mapItems: (items: U[]) => U[],
): void {
  queryClient.setQueriesData<T>({ queryKey: queryKeyPrefix }, (old) => {
    if (!old?.data) return old;
    return { ...old, data: mapItems(old.data) };
  });
}

function prependItemToDataListEntry<U>(
  old: IDataList<U> | undefined,
  item: U,
): IDataList<U> {
  const existing = old?.data ?? [];
  const itemId = (item as { id?: string }).id;
  if (itemId && existing.some((row) => (row as { id?: string }).id === itemId)) {
    return { ...old, data: existing };
  }
  return { ...old, data: [item, ...existing] };
}

export function mapInfinitePaginatedQueries<T extends IPaginated<U>, U>(
  queryClient: QueryClient,
  queryKeyPrefix: readonly unknown[],
  mapFirstPageItems: (items: U[]) => U[],
): void {
  queryClient.setQueriesData<InfiniteData<T>>(
    { queryKey: queryKeyPrefix },
    (old) => {
      if (!old?.pages?.length) return old;
      const [first, ...rest] = old.pages;
      if (!first?.data) return old;
      const nextFirstData = mapFirstPageItems(first.data);
      const added = nextFirstData.length - first.data.length;
      return {
        ...old,
        pages: [
          {
            ...first,
            data: nextFirstData,
            total:
              first.total !== undefined
                ? Math.max(0, first.total + added)
                : first.total,
          },
          ...rest,
        ],
      };
    },
  );
}

export function prependToPaginatedCaches<U>(
  queryClient: QueryClient,
  queryKeyPrefixes: readonly (readonly unknown[])[],
  item: U,
  options?: {
    seedInfiniteKeysIfEmpty?: readonly (readonly unknown[])[];
  },
): void {
  for (const prefix of queryKeyPrefixes) {
    const infiniteEntries = queryClient.getQueriesData<InfiniteData<IPaginated<U>>>(
      { queryKey: prefix },
    );
    const paginatedEntries = queryClient.getQueriesData<IPaginated<U>>({
      queryKey: prefix,
    });

    if (infiniteEntries.length === 0 && paginatedEntries.length === 0) {
      for (const key of options?.seedInfiniteKeysIfEmpty ?? []) {
        queryClient.setQueryData<InfiniteData<IPaginated<U>>>(key, (old) =>
          prependItemToInfiniteEntry(old, item),
        );
      }
    }

    for (const [key] of infiniteEntries) {
      queryClient.setQueryData<InfiniteData<IPaginated<U>>>(key, (old) =>
        prependItemToInfiniteEntry(old, item),
      );
    }

    for (const [key] of paginatedEntries) {
      queryClient.setQueryData<IPaginated<U>>(key, (old) =>
        prependItemToPaginatedEntry(old, item),
      );
    }
  }
}

function prependItemToPaginatedEntry<U>(
  old: IPaginated<U> | undefined,
  item: U,
): IPaginated<U> {
  const existing = old?.data ?? [];
  const itemId = (item as { id?: string }).id;
  if (itemId && existing.some((row) => (row as { id?: string }).id === itemId)) {
    return { ...old, data: existing, total: old?.total };
  }
  const nextData = [item, ...existing];
  return {
    ...old,
    data: nextData,
    total:
      old?.total !== undefined
        ? Math.max(old.total + 1, nextData.length)
        : nextData.length,
  };
}

function prependItemToInfiniteEntry<U>(
  old: InfiniteData<IPaginated<U>> | undefined,
  item: U,
): InfiniteData<IPaginated<U>> {
  const itemId = (item as { id?: string }).id;

  if (!old?.pages?.length) {
    return {
      pages: [{ data: [item], total: 1 }],
      pageParams: [1],
    };
  }

  const [first, ...rest] = old.pages;
  const existing = first?.data ?? [];
  if (itemId && existing.some((row) => (row as { id?: string }).id === itemId)) {
    return old;
  }

  const nextFirstData = [item, ...existing];
  return {
    ...old,
    pages: [
      {
        ...first,
        data: nextFirstData,
        total:
          first.total !== undefined
            ? Math.max(first.total + 1, nextFirstData.length)
            : nextFirstData.length,
      },
      ...rest,
    ],
  };
}

export function prependToDataListCaches<U>(
  queryClient: QueryClient,
  queryKeyPrefixes: readonly (readonly unknown[])[],
  item: U,
  options?: {
    seedKeysIfEmpty?: readonly (readonly unknown[])[];
  },
): void {
  for (const prefix of queryKeyPrefixes) {
    const entries = queryClient.getQueriesData<IDataList<U>>({
      queryKey: prefix,
    });

    if (entries.length === 0) {
      const seedKeys = options?.seedKeysIfEmpty ?? [];
      for (const key of seedKeys) {
        queryClient.setQueryData<IDataList<U>>(key, (old) =>
          prependItemToDataListEntry(old, item),
        );
      }
      continue;
    }

    for (const [key] of entries) {
      queryClient.setQueryData<IDataList<U>>(key, (old) =>
        prependItemToDataListEntry(old, item),
      );
    }
  }
}

export function removeFromPaginatedCaches<U extends { id: string }>(
  queryClient: QueryClient,
  queryKeyPrefixes: readonly (readonly unknown[])[],
  id: string,
): void {
  for (const prefix of queryKeyPrefixes) {
    mapPaginatedQueries<IPaginated<U>, U>(queryClient, prefix, (items) =>
      items.filter((item) => item.id !== id),
    );
    mapInfinitePaginatedQueries<IPaginated<U>, U>(queryClient, prefix, (items) =>
      items.filter((item) => item.id !== id),
    );
  }
}

export function removeFromDataListCaches<U extends { id: string }>(
  queryClient: QueryClient,
  queryKeyPrefixes: readonly (readonly unknown[])[],
  id: string,
): void {
  for (const prefix of queryKeyPrefixes) {
    mapDataListQueries<IDataList<U>, U>(queryClient, prefix, (items) =>
      items.filter((item) => item.id !== id),
    );
  }
}

export function updateInPaginatedCaches<U extends { id: string }>(
  queryClient: QueryClient,
  queryKeyPrefixes: readonly (readonly unknown[])[],
  id: string,
  updater: (item: U) => U,
): void {
  for (const prefix of queryKeyPrefixes) {
    mapPaginatedQueries<IPaginated<U>, U>(queryClient, prefix, (items) =>
      items.map((item) => (item.id === id ? updater(item) : item)),
    );
    mapInfinitePaginatedQueries<IPaginated<U>, U>(queryClient, prefix, (items) =>
      items.map((item) => (item.id === id ? updater(item) : item)),
    );
  }
}

export function updateInDataListCaches<U extends { id: string }>(
  queryClient: QueryClient,
  queryKeyPrefixes: readonly (readonly unknown[])[],
  id: string,
  updater: (item: U) => U,
): void {
  for (const prefix of queryKeyPrefixes) {
    mapDataListQueries<IDataList<U>, U>(queryClient, prefix, (items) =>
      items.map((item) => (item.id === id ? updater(item) : item)),
    );
  }
}

export async function snapshotForPrefixes(
  queryClient: QueryClient,
  prefixes: readonly (readonly unknown[])[],
): Promise<IQuerySnapshot> {
  const merged: IQuerySnapshot = [];
  for (const prefix of prefixes) {
    const part = await cancelAndSnapshot(queryClient, prefix);
    merged.push(...part);
  }
  return merged;
}

export function buildOptimisticTransaction(
  input: ICreateTransactionInput,
  tempId = crypto.randomUUID(),
  resolveTag?: (tagId: string) => {
    id: string;
    name: string;
    color: string | null;
    emoticon: string | null;
  },
): ITransaction {
  const tagIds = input.tagIds ?? [];
  const toTag = (id: string) =>
    resolveTag?.(id) ?? { id, name: "", color: null, emoticon: null };

  return {
    id: tempId,
    type: input.type,
    transferDirection: input.transferDirection ?? null,
    transferGroupId: input.transferGroupId ?? null,
    ledgerAccountId: input.ledgerAccountId ?? null,
    amount: input.amount,
    currency: input.currency,
    transactionDate: input.transactionDate,
    timePrecision: input.timePrecision ?? "DateOnly",
    name: input.name,
    description: input.description ?? null,
    externalId: input.externalId ?? null,
    paymentMethod: input.paymentMethod,
    tags: tagIds.map(toTag),
    primaryTag: input.primaryTagId ? toTag(input.primaryTagId) : null,
    subscription: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function mergeTransactionUpdate(
  transaction: ITransaction,
  input: IUpdateTransactionInput,
): ITransaction {
  const tagIds = input.tagIds;
  return {
    ...transaction,
    ...input,
    description:
      input.description !== undefined
        ? input.description
        : transaction.description,
    tags:
      tagIds !== undefined
        ? tagIds.map((id) => {
            const existing = transaction.tags.find((t) => t.id === id);
            return (
              existing ?? {
                id,
                name: "",
                color: null,
                emoticon: null,
              }
            );
          })
        : transaction.tags,
    primaryTag:
      input.primaryTagId !== undefined
        ? input.primaryTagId
          ? transaction.tags.find((t) => t.id === input.primaryTagId) ??
            {
              id: input.primaryTagId,
              name: "",
              color: null,
              emoticon: null,
            }
          : null
        : transaction.primaryTag,
    updatedAt: nowIso(),
  };
}

export function buildOptimisticTag(
  input: ICreateTagInput,
  tempId = crypto.randomUUID(),
): ITag {
  return {
    id: tempId,
    name: input.name,
    color: input.color ?? null,
    description: input.description ?? null,
    emoticon: input.emoticon ?? null,
    order: input.order ?? 0,
    transactionType: input.transactionType,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function buildOptimisticBudget(
  input: ICreateBudgetInput,
  userId: string,
  tempId = crypto.randomUUID(),
): IBudget {
  const ts = nowIso();
  return {
    id: tempId,
    userId,
    name: input.name,
    periodType: input.periodType,
    startDate: input.startDate,
    endDate: input.endDate,
    currency: input.currency,
    items: input.items.map((item, index) => {
      const itemId = `temp-item-${index}`;
      return {
        id: itemId,
        budgetId: tempId,
        tagId: item.tagId,
        categoryType: item.categoryType ?? null,
        createdAt: ts,
        updatedAt: ts,
        monthlyAmounts: item.monthlyAmounts.map((m, mi) => ({
          id: `temp-ma-${index}-${mi}`,
          budgetItemId: itemId,
          year: m.year,
          month: m.month,
          expectedAmount: m.expectedAmount,
          createdAt: ts,
          updatedAt: ts,
        })),
      };
    }),
    createdAt: ts,
    updatedAt: ts,
  };
}

export function buildOptimisticSubscription(
  input: {
    name: string;
    type: ISubscription["type"];
    amount: string;
    currency: string;
    frequency: ISubscription["frequency"];
  },
  tempId = crypto.randomUUID(),
): ISubscription {
  return {
    id: tempId,
    name: input.name,
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    frequency: input.frequency,
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function buildOptimisticNotification(
  input: ICreateNotificationInput,
  userId: string,
  tempId = crypto.randomUUID(),
): INotification {
  return {
    id: tempId,
    userId,
    title: input.title,
    content: input.content,
    type: input.type ?? "INFO",
    actions: input.actions ?? null,
    read: false,
    readAt: null,
    relatedId: input.relatedId ?? null,
    relatedType: input.relatedType ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function buildOptimisticTagRule(
  input: ICreateTagRuleInput,
  tempId = crypto.randomUUID(),
): ITagRule {
  return {
    id: tempId,
    tagId: input.tagId,
    label: input.label ?? null,
    keywords: input.keywords ?? [],
    pattern: input.pattern ?? null,
    patternType: input.patternType,
    matchFields: input.matchFields,
    applyAs: input.applyAs,
    priority: input.priority ?? 0,
    source: input.source ?? "USER",
    enabled: input.enabled ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function buildOptimisticWorkspace(
  name: string,
  tempId = Math.floor(Math.random() * 1_000_000),
): IWorkspaceSummary {
  return {
    id: tempId,
    name,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function transactionListPrefixes(
  workspaceId: number,
): readonly (readonly unknown[])[] {
  return [
    ["transactions", workspaceId],
    ["expenses", workspaceId],
    ["incomes", workspaceId],
  ];
}

export function defaultTransactionInfiniteSeedKey(
  workspaceId: number,
): readonly unknown[] {
  return [
    "transactions",
    workspaceId,
    {
      limit: 20,
      from: undefined,
      to: undefined,
      type: undefined,
      tagIds: undefined,
      q: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      paymentMethod: undefined,
      currency: undefined,
      page: undefined,
    },
  ];
}

export function optimisticMeWorkspaceHandlers(
  queryClient: QueryClient,
  apply: (me: IUserResponse) => IUserResponse,
) {
  const key = ["me"] as const;
  const previous = queryClient.getQueryData<IUserResponse>(key);
  if (previous) {
    queryClient.setQueryData(key, apply(previous));
  }
}
