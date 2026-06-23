import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Tooltip } from "../tooltip/tooltip";

export type IButtonToggleSize = "sm" | "md";

export type IButtonToggleOption<T extends string> = {
  value: T;
  label?: string;
  icon?: ReactNode;
  tooltip?: string;
  disabled?: boolean;
};

export type IButtonToggleGroupProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: IButtonToggleOption<T>[];
  size?: IButtonToggleSize;
  /** Accessible name when options have icons only */
  ariaLabel?: string;
  disabled?: boolean;
} & IPropsWithClassName;

const sizeClasses: Record<
  IButtonToggleSize,
  { track: string; indicator: string; button: string; icon: string }
> = {
  sm: {
    track: "p-0.5",
    indicator: "top-0.5 bottom-0.5",
    button: "px-2.5 py-1 text-xs min-h-7 min-w-8",
    icon: "size-3.5",
  },
  md: {
    track: "p-1",
    indicator: "top-1 bottom-1",
    button: "px-3 py-1.5 text-sm min-h-8 min-w-10",
    icon: "size-4",
  },
};

type IIndicatorStyle = {
  left: number;
  width: number;
};

export function ButtonToggleGroup<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  ariaLabel,
  disabled = false,
  className,
}: IButtonToggleGroupProps<T>) {
  const sizes = sizeClasses[size];
  const trackRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [indicator, setIndicator] = useState<IIndicatorStyle>({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const selectedIndex = options.findIndex((option) => option.value === value);
    const segment = segmentRefs.current[selectedIndex];
    const track = trackRef.current;

    if (!segment || !track || selectedIndex < 0) {
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const segmentRect = segment.getBoundingClientRect();

    setIndicator({
      left: segmentRect.left - trackRect.left,
      width: segmentRect.width,
    });
  }, [options, value]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, options.length]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateIndicator();
    });

    observer.observe(track);
    segmentRefs.current.forEach((segment) => {
      if (segment) {
        observer.observe(segment);
      }
    });

    return () => observer.disconnect();
  }, [updateIndicator, options.length]);

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-stretch rounded-xl border border-border bg-surface-hover/60",
        sizes.track,
        className
      )}>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-lg bg-primary shadow-sm",
          sizes.indicator,
          "transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
        )}
        style={{
          left: indicator.left,
          width: indicator.width,
        }}
      />

      {options.map((option, index) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;
        const hasDivider =
          index > 0 && !isSelected && value !== options[index - 1]?.value;

        const segment = (
          <span
            ref={(node) => {
              segmentRefs.current[index] = node;
            }}
            data-segment
            className="relative z-10 flex min-w-0 flex-1">
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.tooltip ?? option.label ?? option.value}
              disabled={isDisabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative inline-flex w-full flex-1 items-center justify-center gap-1.5 font-medium",
                "transition-colors duration-200 ease-out motion-reduce:transition-none",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                sizes.button,
                isSelected
                  ? "text-white"
                  : "rounded-lg text-text-muted hover:text-text hover:bg-surface/40",
                hasDivider &&
                  "before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-px before:bg-border/70",
                isDisabled && "cursor-not-allowed opacity-50"
              )}>
              {option.icon && (
                <span className={cn("shrink-0", sizes.icon)}>{option.icon}</span>
              )}
              {option.label && <span>{option.label}</span>}
            </button>
          </span>
        );

        if (option.tooltip) {
          return (
            <span
              key={option.value}
              className="flex min-w-0 flex-1">
              <Tooltip
                content={option.tooltip}
                disabled={isDisabled}>
                {segment}
              </Tooltip>
            </span>
          );
        }

        return (
          <span
            key={option.value}
            className="flex min-w-0 flex-1">
            {segment}
          </span>
        );
      })}
    </div>
  );
}
