import type { ITransaction } from "@/features/shared/validation/schemas";
import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";

/**
 * Escape a value for CSV format
 * If value contains comma, quote, or newline, wrap in double quotes
 * Escape double quotes by doubling them
 */
function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    // Wrap in quotes and escape internal quotes
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Get the value for a specific column from a transaction
 */
function getColumnValue(transaction: ITransaction, column: string): string {
  switch (column) {
    case "Name":
      return transaction.name;
    case "Amount":
      return formatCurrency(transaction.amount, transaction.currency);
    case "Date":
      return DateFormatHelpers.formatIsoStringToString(transaction.occurredAt);
    case "Description":
      return transaction.description ?? "";
    case "Tags":
      return transaction.tags.map((tag) => tag.name).join(", ");
    default:
      return "";
  }
}

/**
 * Export transactions to CSV and trigger download
 * @param transactions - Array of transactions to export
 * @param columns - Array of column names to include in the CSV
 * @param filename - Name of the file to download (without extension)
 */
export function exportTransactionsToCsv(
  transactions: ITransaction[],
  columns: string[],
  filename?: string
): void {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];
  const mappedFilename = `${filename ?? "transactions"}_${date}-${time}`;

  // Generate CSV headers
  const headers = columns.map((col) => escapeCsvValue(col)).join(",");

  // Generate CSV rows
  const rows = transactions.map((transaction) => {
    return columns
      .map((column) => {
        const value = getColumnValue(transaction, column);
        return escapeCsvValue(value);
      })
      .join(",");
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows].join("\n");

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${mappedFilename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
