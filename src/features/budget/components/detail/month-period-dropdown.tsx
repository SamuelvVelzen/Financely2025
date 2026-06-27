import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { HiCalendar } from "react-icons/hi2";

type IMonthPeriodDropdownProps = {
  selectedMonthKey: string | null;
  selectedMonthLabel: string | null;
  monthOptions: { value: string; label: string }[];
  onMonthChange: (monthKey: string | null) => void;
  size?: "xs" | "sm";
};

export function MonthPeriodDropdown({
  selectedMonthKey,
  selectedMonthLabel,
  monthOptions,
  onMonthChange,
  size = "sm",
}: IMonthPeriodDropdownProps) {
  const handleMonthOptionSelect = (value: string) => {
    onMonthChange(value === "all" ? null : value);
  };

  return (
    <Dropdown
      size={size}
      placement={["bottom", "top"]}
      dropdownSelector={{
        variant: selectedMonthKey ? "primary" : "default",
        content: (
          <div className="flex items-center gap-2">
            <HiCalendar className="size-4" />
            <span>{selectedMonthLabel ?? "Period"}</span>
          </div>
        ),
      }}>
      {monthOptions.map((option) => (
        <DropdownItem
          key={option.value}
          clicked={() => handleMonthOptionSelect(option.value)}
          selected={(selectedMonthKey ?? "all") === option.value}>
          {option.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
