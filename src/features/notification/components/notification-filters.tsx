import type { INotificationType } from "@/features/shared/validation/enums";
import { ButtonToggleGroup } from "@/features/ui/button/button-toggle-group";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { cn } from "@/features/util/cn";
import { HiFunnel } from "react-icons/hi2";
import type { INotificationStatusFilter } from "../utils/notification-filter-query-schema";
import { NOTIFICATION_TYPE_META } from "../utils/notification-type-meta";

const STATUS_OPTIONS: {
  value: INotificationStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const TYPE_ENTRIES = Object.entries(NOTIFICATION_TYPE_META) as [
  INotificationType,
  (typeof NOTIFICATION_TYPE_META)[INotificationType],
][];

type INotificationFiltersProps = {
  status: INotificationStatusFilter;
  type: INotificationType | undefined;
  onStatusChange: (status: INotificationStatusFilter) => void;
  onTypeChange: (type: INotificationType | undefined) => void;
  className?: string;
};

export function NotificationFilters({
  status,
  type,
  onStatusChange,
  onTypeChange,
  className,
}: INotificationFiltersProps) {
  const hasTypeFilter = type !== undefined;

  return (
    <div
      className={cn(
        "mb-3 flex min-w-0 flex-wrap items-center gap-2 md:gap-3",
        className,
      )}>
      <ButtonToggleGroup
        size="sm"
        ariaLabel="Filter by read status"
        value={status}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
      />

      <Dropdown
        size="sm"
        placement="bottom"
        closeOnItemClick
        dropdownSelector={{
          content: (
            <div className="flex items-center gap-2">
              <HiFunnel className="size-4" />
              <span>
                {hasTypeFilter ? NOTIFICATION_TYPE_META[type].label : "Type"}
              </span>
            </div>
          ),
          variant: hasTypeFilter ? "primary" : "default",
        }}>
        <DropdownItem
          selected={!hasTypeFilter}
          clicked={() => onTypeChange(undefined)}
          text="All types"
        />
        {TYPE_ENTRIES.map(([value, meta]) => {
          const Icon = meta.icon;
          return (
            <DropdownItem
              key={value}
              selected={type === value}
              clicked={() => onTypeChange(value)}
              icon={<Icon className={cn("size-4", meta.iconClassName)} />}
              text={meta.label}
            />
          );
        })}
      </Dropdown>
    </div>
  );
}
