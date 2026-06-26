import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, {
  useCallback,
  useContext,
  useEffect,
  useId,
  type KeyboardEvent,
} from "react";
import { type IconType } from "react-icons";
import { RadioGroupContext } from "./radio-group-context";

export type IRadioItemProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "id" | "name" | "value" | "role" | "aria-checked"
> &
  IPropsWithClassName & {
    value: string | number;
    id?: string;
    children?: React.ReactNode;
    icon?: IconType;
  };

function getAdjacentItemValue(
  items: string[],
  currentValue: string,
  direction: -1 | 1,
  isItemDisabled: (value: string) => boolean
): string | null {
  const currentIndex = items.indexOf(currentValue);
  if (currentIndex === -1) {
    return null;
  }

  for (let step = 1; step <= items.length; step++) {
    const nextIndex =
      (currentIndex + direction * step + items.length) % items.length;
    const nextValue = items[nextIndex];
    if (!isItemDisabled(nextValue)) {
      return nextValue;
    }
  }

  return null;
}

export function RadioItem({
  className,
  id,
  value,
  disabled,
  children,
  icon: Icon,
  onKeyDown,
  ...props
}: IRadioItemProps) {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioItem must be used within a RadioGroup");
  }

  const generatedId = useId();
  const stringValue = String(value);
  const buttonId = id || `${context.groupId}-item-${stringValue}-${generatedId}`;
  const isChecked = context.value === value;
  const isDisabled = disabled || context.disabled;

  const handleChange = useCallback(() => {
    if (!isDisabled) {
      context.onChange(value);
    }
  }, [context, isDisabled, value]);

  const setButtonRef = useCallback(
    (element: HTMLButtonElement | null) => {
      context.registerItem(stringValue, element);
    },
    [context, stringValue]
  );

  useEffect(() => {
    return () => {
      context.registerItem(stringValue, null);
    };
  }, [context, stringValue]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || isDisabled) {
      return;
    }

    const items = context.getItems();
    const previousKey = "ArrowLeft";
    const nextKey = "ArrowRight";

    const isItemDisabled = (itemValue: string) =>
      context.getItemElement(itemValue)?.disabled ?? false;

    if (event.key === previousKey || event.key === nextKey) {
      event.preventDefault();
      const direction = event.key === previousKey ? -1 : 1;
      const nextValue = getAdjacentItemValue(
        items,
        stringValue,
        direction,
        isItemDisabled
      );
      if (!nextValue) {
        return;
      }

      context.onChange(nextValue);
      context.focusItem(nextValue);
    }
  };

  return (
    <div className="relative group min-w-0 flex-1">
      <button
        {...props}
        ref={setButtonRef}
        type="button"
        id={buttonId}
        role="radio"
        aria-checked={isChecked}
        disabled={isDisabled}
        onClick={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative block w-full cursor-pointer focus:outline-none p-2 rounded-2xl border transition-all text-left hover:border-primary/50 hover:bg-surface-hover/50 h-full",
          "focus-visible:ring-2 focus-visible:ring-primary",
          "border-border bg-surface",
          isDisabled && "opacity-50 cursor-not-allowed",
          isChecked && "border-primary bg-primary/5 hover:border-primary",
          className
        )}>
        <div className="flex items-center gap-3 h-full">
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
      </button>
    </div>
  );
}
