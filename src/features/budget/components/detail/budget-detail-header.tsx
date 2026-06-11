import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { LinkButton } from "@/features/ui/button/link-button";
import { Container } from "@/features/ui/container/container";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { cn } from "@/features/util/cn";
import {
  HiArrowLeft,
  HiCalendar,
  HiOutlineCurrencyEuro,
  HiPencil,
  HiTrash,
} from "react-icons/hi2";

type IBudgetDetailHeaderProps = {
  budgetName: string;
  isSticky: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  hasMultipleMonths: boolean;
  selectedMonthKey: string | null;
  selectedMonthLabel: string | null;
  periodViewLabel: string | null;
  monthOptions: { value: string; label: string }[];
  onMonthChange: (monthKey: string | null) => void;
};

export function BudgetDetailHeader({
  budgetName,
  isSticky,
  onBack,
  onEdit,
  onDelete,
  hasMultipleMonths,
  selectedMonthKey,
  selectedMonthLabel,
  periodViewLabel,
  monthOptions,
  onMonthChange,
}: IBudgetDetailHeaderProps) {
  const showPeriodControls = hasMultipleMonths || periodViewLabel;

  const handleMonthOptionSelect = (value: string) => {
    onMonthChange(value === "all" ? null : value);
  };

  return (
    <Container className={cn("sticky z-10 top-0 transition-all")}>
      <div
        className={cn(
          "flex items-center justify-between gap-2 transition-all",
          showPeriodControls && !isSticky && "mb-3",
        )}>
        <div className="flex min-w-0 items-center gap-2">
          <IconButton clicked={onBack} ariaLabel="Back to budgets">
            <HiArrowLeft className="size-4 shrink-0" />
          </IconButton>
          <HiOutlineCurrencyEuro
            className={cn(
              "shrink-0 transition-all",
              isSticky ? "size-5" : "size-6",
            )}
          />
          <span
            className={cn(
              "truncate transition-all",
              isSticky ? "text-base font-semibold" : "text-xl font-bold",
            )}>
            {budgetName}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isSticky && hasMultipleMonths && (
            <Dropdown
              size="xs"
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
          )}

          {isSticky ? (
            <>
              <IconButton clicked={onEdit} size="sm" ariaLabel="Edit budget">
                <HiPencil className="size-4" />
              </IconButton>
              <IconButton
                clicked={onDelete}
                variant="danger"
                size="sm"
                ariaLabel="Delete budget">
                <HiTrash className="size-4" />
              </IconButton>
            </>
          ) : (
            <>
              <Button variant="secondary" clicked={onEdit} size="sm">
                <HiPencil className="size-4 mr-2" />
                Edit
              </Button>
              <Button variant="danger" clicked={onDelete} size="sm">
                <HiTrash className="size-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {showPeriodControls && (
        <div
          inert={isSticky ? true : undefined}
          className={cn(
            "grid transition-[grid-template-rows,opacity] ease-out",
            isSticky ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
          )}>
          <div className={cn(isSticky && "overflow-hidden")}>
            {hasMultipleMonths && (
              <div className="flex items-center gap-3">
                <div className="max-w-xs flex-1">
                  <SelectDropdown
                    value={selectedMonthKey ?? "all"}
                    onChange={(val) => handleMonthOptionSelect(val as string)}
                    options={monthOptions}
                    clearable={false}
                  />
                </div>
                {selectedMonthKey && (
                  <LinkButton
                    variant="primary"
                    clicked={() => onMonthChange(null)}>
                    All months
                  </LinkButton>
                )}
              </div>
            )}
            {periodViewLabel && (
              <p className="text-sm text-text-muted mt-1.5">{periodViewLabel}</p>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}
