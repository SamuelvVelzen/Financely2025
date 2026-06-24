import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
import {
  type IFormOrControlledMode,
} from "@/features/shared/hooks/use-form-context-optional";
import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useEffect, useRef, useState } from "react";
import { HiX } from "react-icons/hi";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { TextInput } from "./text-input";

export type ISearchInputProps = IPropsWithClassName & {
  placeholder?: string;
  label?: string;
  /** Keep search expanded to fill available width (e.g. mobile filter row). */
  alwaysExpanded?: boolean;
  size?: "sm" | "md";
} & IFormOrControlledMode<string>;

export function SearchInput({
  className = "",
  name,
  placeholder = "Search",
  label,
  alwaysExpanded = false,
  size = "md",
  value: controlledValue,
  onChange: controlledOnChange,
  onValueChange,
}: ISearchInputProps) {
  const { field, mode, form } = useFieldAdapter({
    name,
    value: controlledValue,
    onChange: controlledOnChange,
    onValueChange,
  });

  // Get current value
  const value = String(field.value || "");

  const [isHovered, setIsHovered] = useState(false);

  const handleClear = () => {
    if (mode === "controlled") {
      field.onChange("");
    } else if (mode === "form" && form && name) {
      form.setValue(name, "");
      onValueChange?.("");
    }
  };

  const isEmpty = !value;
  const isOpen = alwaysExpanded || !isEmpty || isHovered;
  const isCollapsed = alwaysExpanded ? false : isEmpty && !isHovered;
  const showClear = !isEmpty;

  const measureRef = useRef<HTMLSpanElement>(null);
  const [expandedWidth, setExpandedWidth] = useState(300);

  useEffect(() => {
    if (alwaysExpanded || !measureRef.current) {
      return;
    }
    const width = measureRef.current.offsetWidth;
    setExpandedWidth(Math.max(300, width + 80));
  }, [alwaysExpanded, placeholder]);

  const iconSizeClass = size === "sm" ? "size-4" : "size-5";
  const inputSizeClass =
    size === "sm" ? "text-sm min-h-7 h-7 py-1" : undefined;

  return (
    <>
      {!alwaysExpanded && (
        <span
          ref={measureRef}
          className="absolute invisible whitespace-nowrap text-base"
          style={{ font: "inherit" }}>
          {placeholder}...
        </span>
      )}
      <div
        data-collapsed={alwaysExpanded ? false : isCollapsed}
        data-empty={isEmpty}
        data-open={isOpen}
        onMouseEnter={() => !alwaysExpanded && setIsHovered(true)}
        onMouseLeave={() => !alwaysExpanded && setIsHovered(false)}
        style={
          alwaysExpanded
            ? undefined
            : ({
              "--expanded-width": `${expandedWidth}px`,
            } as React.CSSProperties)
        }
        className={cn(
          "relative transition-all ease-in-out min-w-0",
          ...(alwaysExpanded
            ? ["w-full"]
            : [
              "w-28 hover:w-(--expanded-width) focus-within:w-(--expanded-width)",
              "has-[input:not(:placeholder-shown)]:w-(--expanded-width)",
              "data-[open=true]:w-(--expanded-width)",
            ]),
          !alwaysExpanded && "data-[collapsed=true]:[&_input]:pr-2!",
          (alwaysExpanded || isOpen) && "[&_input]:pl-9!",
          showClear && (alwaysExpanded || isOpen) && "[&_input]:pr-9!",
          !alwaysExpanded && "focus-within:[&_input]:pl-9!",
          showClear && !alwaysExpanded && "focus-within:[&_input]:pr-9!",
          !alwaysExpanded && "data-[collapsed=true]:[&>div>div>div:last-child]:hidden",
          className
        )}>
        <TextInput
          {...(mode === "form"
            ? ({ name, onValueChange } as { name: string; onValueChange?: (value: string | number | undefined) => void })
            : ({
              value: controlledValue,
              onChange: (value: string | number | undefined) => {
                const asString =
                  value === undefined || value === null
                    ? undefined
                    : String(value);
                controlledOnChange?.(asString);
                onValueChange?.(asString);
              },
            } as {
              value: string;
              onChange: (value: string | number | undefined) => void;
            }))}
          label={label}
          placeholder={placeholder}
          className={cn("truncate", inputSizeClass)}
          prefixIcon={<HiMagnifyingGlass className={iconSizeClass} />}
          suffixIcon={
            showClear ? (
              <IconButton
                clicked={handleClear}
                ariaLabel="Clear search"
                size="xs"
                className="p-0">
                <HiX className={iconSizeClass} />
              </IconButton>
            ) : undefined
          }
        />
      </div>
    </>
  );
}
