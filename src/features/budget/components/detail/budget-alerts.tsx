"use client";

import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import type { IBudgetAlert } from "@/features/shared/validation/schemas";
import { Alert } from "@/features/ui/alert/alert";
import { Badge } from "@/features/ui/badge/badge";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";

type IBudgetAlertsProps = {
  alerts: IBudgetAlert[];
} & IPropsWithClassName;

export function BudgetAlerts({ alerts, className = "" }: IBudgetAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Alert
        variant="warning"
        className="border-warning">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold mb-2">
              Transactions without budget entries
            </div>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.tagId}
                  className="flex items-center justify-between p-2 bg-warning-bg rounded">
                  <div className="flex items-center gap-2">
                    {alert.tagColor && (
                      <div
                        className="size-3 rounded-full"
                        style={{ backgroundColor: alert.tagColor }}
                      />
                    )}
                    <span className="font-medium">{alert.tagName}</span>
                    <Badge>
                      {alert.transactionCount} transaction
                      {alert.transactionCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatCurrency(
                        alert.totalAmount,
                        alert.transactions[0].currency
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}
