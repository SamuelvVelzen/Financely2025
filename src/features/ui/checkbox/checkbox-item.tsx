import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useCallback, useContext, useId, useRef } from "react";
import { IconType } from "react-icons";

export type ICheckboxGroupContext = {
  name: string;
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  disabled?: boolean;
  groupId: string;
};

export const CheckboxGroupContext =
  React.createContext<ICheckboxGroupContext | null>(null);

export type ICheckboxItemProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "id" | "name" | "checked" | "onChange" | "value"
> &
  IPropsWithClassName & {
    value: string | number;
    id?: string;
    children?: React.ReactNode;
    icon?: IconType;
  };

export function CheckboxItem({
  className,
  id,
  value,
  disabled,
  children,
  icon: Icon,
  ...props
}: ICheckboxItemProps) {
  const context = useContext(CheckboxGroupContext);
  if (!context) {
    throw new Error("CheckboxItem must be used within a CheckboxGroup");
  }

  const generatedId = useId();
  const checkboxId = id || `${context.groupId}-${generatedId}`;
  const currentValue = context.value || [];
  const isEmpty = currentValue.length === 0;

  // Check if this value is in the array, or if empty array means all selected (always true)
  const isChecked = isEmpty
    ? true
    : currentValue.some((v) => String(v) === String(value));
  const isDisabled = disabled || context.disabled;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(() => {
    if (isDisabled) return;

    // Read current value from context to avoid stale closures
    const currentValueArray = context.value || [];
    const isEmpty = currentValueArray.length === 0;

    // If empty (all selected), clicking a checkbox should set array to only that value
    if (isEmpty) {
      context.onChange([value]);
      return;
    }

    const currentlyChecked = currentValueArray.some(
      (v) => String(v) === String(value)
    );

    const newValue = currentlyChecked
      ? currentValueArray.filter((v) => String(v) !== String(value))
      : [...currentValueArray, value];

    context.onChange(newValue);
  }, [isDisabled, value, context]);

  return (
    <div className="relative group grow">
      <input
        ref={inputRef}
        type="checkbox"
        id={checkboxId}
        name={context.name}
        value={String(value)}
        checked={isChecked}
        onChange={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleChange();
        }}
        disabled={isDisabled}
        className="sr-only peer"
        aria-checked={isChecked}
        {...props}
      />
      <label
        htmlFor={checkboxId}
        className={cn(
          "relative block cursor-pointer focus:outline-none p-2 rounded-2xl border transition-all text-left hover:border-primary/50 hover:bg-surface-hover/50",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-primary",
          "border-border bg-surface",
          isDisabled && "opacity-50 cursor-not-allowed",
          isChecked && "border-primary bg-primary/5 hover:border-primary",
          className
        )}
        onClick={(e) => {
          // Prevent label click from bubbling, but let htmlFor trigger input click
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          // Prevent focus on mouse click to maintain keyboard-only focus styles
          if (!isDisabled && e.detail > 0) {
            e.preventDefault();
          }
        }}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={cn(
                "p-2 rounded-2xl shrink-0 bg-surface-hover text-text-muted",
                isChecked && "bg-primary text-white"
              )}>
              <Icon className="size-5" />
            </div>
          )}

          {children}
        </div>

        {isChecked && (
          <div className="absolute top-2 right-2">
            <div className="size-2 bg-primary rounded-full" />
          </div>
        )}
      </label>
    </div>
  );
}
