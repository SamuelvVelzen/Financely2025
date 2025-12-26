"use client";

import type { IBudgetAlert } from "@/features/shared/validation/schemas";
import { Alert } from "@/features/ui/alert/alert";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { HiExclamationTriangle } from "react-icons/hi2";

type IBudgetAlertsProps = {
  alerts: IBudgetAlert[];
  onAddBudgetItem?: (tagId: string) => void;
};

export function BudgetAlerts({ alerts, onAddBudgetItem }: IBudgetAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Alert
        variant="warning"
        className="border-warning">
        <div className="flex items-start gap-3">
          <HiExclamationTriangle className="size-5 text-warning shrink-0 mt-0.5" />
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
                      {parseFloat(alert.totalAmount).toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                    {onAddBudgetItem && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        clicked={() => onAddBudgetItem(alert.tagId)}>
                        Add Budget Item
                      </Button>
                    )}
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
