import type { IOfflineMutationRecord } from "@/features/shared/offline/offline-mutation-outbox";

export interface IOfflineMutationSummary {
  title: string;
  detail?: string;
}

function bodyRecord(
  record: IOfflineMutationRecord,
): Record<string, unknown> | undefined {
  if (!record.body || typeof record.body !== "object" || Array.isArray(record.body)) {
    return undefined;
  }
  return record.body as Record<string, unknown>;
}

function readName(body: Record<string, unknown> | undefined): string | undefined {
  const name = body?.name;
  return typeof name === "string" && name.trim() !== "" ? name : undefined;
}

export function summarizeOfflineMutation(
  record: IOfflineMutationRecord,
): IOfflineMutationSummary {
  const endpoint = record.endpoint;
  const body = bodyRecord(record);
  const name = readName(body);

  if (record.contentType === "multipart") {
    if (endpoint.includes("csv-upload")) {
      return { title: "Upload CSV file" };
    }
    if (endpoint.includes("csv-parse")) {
      return { title: "Parse CSV file" };
    }
    return { title: "File upload" };
  }

  if (endpoint.includes("/tags") && record.method === "POST") {
    return {
      title: "Create tag",
      detail: name,
    };
  }
  if (endpoint.includes("/tags/") && record.method === "PATCH") {
    return { title: "Update tag", detail: name };
  }
  if (endpoint.includes("/tags/") && record.method === "DELETE") {
    return { title: "Delete tag" };
  }
  if (endpoint.includes("/tags/csv-import")) {
    const tags = body?.tags;
    const count = Array.isArray(tags) ? tags.length : undefined;
    return {
      title: "Import tags from CSV",
      detail: count !== undefined ? `${count} tag${count === 1 ? "" : "s"}` : undefined,
    };
  }

  if (endpoint.includes("/transactions") && record.method === "POST") {
    const type = body?.type === "INCOME" ? "Income" : "Expense";
    return {
      title: `Create ${type.toLowerCase()}`,
      detail: name,
    };
  }
  if (endpoint.includes("/transactions/") && record.method === "PATCH") {
    return { title: "Update transaction", detail: name };
  }
  if (endpoint.includes("/transactions/") && record.method === "DELETE") {
    return { title: "Delete transaction" };
  }
  if (endpoint.includes("/transactions/csv-import")) {
    const txs = body?.transactions;
    const count = Array.isArray(txs) ? txs.length : undefined;
    return {
      title: "Import transactions from CSV",
      detail:
        count !== undefined
          ? `${count} transaction${count === 1 ? "" : "s"}`
          : undefined,
    };
  }

  if (endpoint.includes("/budgets") && record.method === "POST") {
    return { title: "Create budget", detail: name };
  }
  if (endpoint.includes("/budgets/") && record.method === "PATCH") {
    return { title: "Update budget", detail: name };
  }
  if (endpoint.includes("/budgets/") && record.method === "DELETE") {
    return { title: "Delete budget" };
  }

  if (endpoint.includes("/subscriptions") && record.method === "POST") {
    return { title: "Confirm subscription", detail: name };
  }
  if (endpoint.includes("/subscriptions/") && record.method === "PATCH") {
    return { title: "Update subscription", detail: name };
  }
  if (endpoint.includes("/subscriptions/") && record.method === "DELETE") {
    return { title: "Delete subscription" };
  }

  if (endpoint.includes("/tag-rules") && record.method === "POST") {
    return { title: "Create tag rule" };
  }

  if (endpoint.includes("/messages") && record.method === "POST") {
    const title = body?.title;
    return {
      title: "Create message",
      detail: typeof title === "string" ? title : undefined,
    };
  }

  return {
    title: `${record.method} ${endpoint}`,
  };
}

export function formatOfflineMutationTime(createdAt: number): string {
  return new Date(createdAt).toLocaleString();
}
