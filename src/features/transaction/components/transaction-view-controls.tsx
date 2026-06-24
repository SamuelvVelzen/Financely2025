import type { ITransactionLayoutMode } from "@/features/transaction/hooks/use-transaction-view-mode";
import { ButtonToggleGroup } from "@/features/ui/button/button-toggle-group";
import { cn } from "@/features/util/cn";
import {
  HiBars3BottomLeft,
  HiListBullet,
  HiQueueList,
  HiTableCells,
} from "react-icons/hi2";

export type ITransactionViewControlsProps = {
  layout: ITransactionLayoutMode;
  showDescriptions: boolean;
  onLayoutChange: (layout: ITransactionLayoutMode) => void;
  onShowDescriptionsChange: (show: boolean) => void;
  className?: string;
  size?: "sm" | "md";
  /** Layout toggle only — hides descriptions switch (e.g. sticky header). */
  compact?: boolean;
  /** Stacked layout with labels for bottom sheet / forms. */
  variant?: "inline" | "sheet";
};

const layoutOptions = [
  {
    value: "list" as const,
    icon: <HiListBullet className="size-full" />,
    label: "List",
    tooltip: "List view",
  },
  {
    value: "table" as const,
    icon: <HiTableCells className="size-full" />,
    label: "Table",
    tooltip: "Table view",
  },
];

const detailOptions = [
  {
    value: "full" as const,
    icon: <HiBars3BottomLeft className="size-full" />,
    label: "Full",
    tooltip: "Show descriptions",
  },
  {
    value: "compact" as const,
    icon: <HiQueueList className="size-full" />,
    label: "Compact",
    tooltip: "Hide descriptions",
  },
];

export function TransactionViewControls({
  layout,
  showDescriptions,
  onLayoutChange,
  onShowDescriptionsChange,
  className,
  size = "sm",
  compact = false,
  variant = "inline",
}: ITransactionViewControlsProps) {
  const showLabels = variant === "sheet";
  const layoutToggle = (
    <ButtonToggleGroup
      size={size}
      ariaLabel="Transaction view"
      value={layout}
      onChange={onLayoutChange}
      className={variant === "sheet" ? "w-full" : undefined}
      options={layoutOptions.map((option) => ({
        ...option,
        label: showLabels ? option.label : undefined,
      }))}
    />
  );

  const detailToggle =
    !compact && layout === "list" ? (
      <ButtonToggleGroup
        size={size}
        ariaLabel="List detail"
        value={showDescriptions ? "full" : "compact"}
        onChange={(value) => onShowDescriptionsChange(value === "full")}
        className={variant === "sheet" ? "w-full" : undefined}
        options={detailOptions.map((option) => ({
          ...option,
          label: showLabels ? option.label : undefined,
        }))}
      />
    ) : null;

  if (variant === "sheet") {
    return (
      <div className={cn("space-y-4", className)}>
        <div>
          <span className="block text-sm font-medium text-text mb-2">
            View
          </span>
          {layoutToggle}
        </div>
        {detailToggle && (
          <div>
            <span className="block text-sm font-medium text-text mb-2">
              List detail
            </span>
            {detailToggle}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 shrink-0", className)}>
      {layoutToggle}
      {detailToggle}
    </div>
  );
}
