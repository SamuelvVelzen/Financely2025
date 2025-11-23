"use client";

import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { useEffect, useRef, useState } from "react";
import { HiX } from "react-icons/hi";

export type IPriceRange = {
  min?: number;
  max?: number;
};

export type IRangeInputProps = IPropsWithClassName & {
  value: IPriceRange;
  onChange: (range: IPriceRange) => void;
  placeholder?: {
    min?: string;
    max?: string;
  };
  minRange?: number;
  maxRange?: number;
};

export function RangeInput({
  className = "",
  value,
  onChange,
  placeholder = { min: "Min", max: "Max" },
  minRange = 0,
  maxRange = 10000,
}: IRangeInputProps) {
  const [minInput, setMinInput] = useState<string>(value.min?.toString() ?? "");
  const [maxInput, setMaxInput] = useState<string>(value.max?.toString() ?? "");
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Sync local input state with value prop
  useEffect(() => {
    setMinInput(value.min?.toString() ?? "");
    setMaxInput(value.max?.toString() ?? "");
  }, [value.min, value.max]);

  const currentMin = value.min ?? minRange;
  const currentMax = value.max ?? maxRange;

  const getPercentage = (val: number) => {
    return ((val - minRange) / (maxRange - minRange)) * 100;
  };

  const getValueFromPercentage = (percentage: number) => {
    return minRange + (percentage / 100) * (maxRange - minRange);
  };

  const handleMouseDown = (type: "min" | "max") => {
    setIsDragging(type);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = Math.round(getValueFromPercentage(percentage));

    if (isDragging === "min") {
      const clampedValue = Math.min(newValue, currentMax - 1);
      onChange({ ...value, min: clampedValue });
    } else {
      const clampedValue = Math.max(newValue, currentMin + 1);
      onChange({ ...value, max: clampedValue });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, currentMin, currentMax, value]);

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMinInput(inputValue);
    const minValue = inputValue ? parseFloat(inputValue) : undefined;
    if (minValue !== undefined && !isNaN(minValue)) {
      const clampedValue = Math.min(
        Math.max(minRange, minValue),
        currentMax - 1
      );
      onChange({ ...value, min: clampedValue });
    } else if (inputValue === "") {
      onChange({ ...value, min: undefined });
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMaxInput(inputValue);
    const maxValue = inputValue ? parseFloat(inputValue) : undefined;
    if (maxValue !== undefined && !isNaN(maxValue)) {
      const clampedValue = Math.max(
        Math.min(maxRange, maxValue),
        currentMin + 1
      );
      onChange({ ...value, max: clampedValue });
    } else if (inputValue === "") {
      onChange({ ...value, max: undefined });
    }
  };

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current || isDragging) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = Math.round(getValueFromPercentage(percentage));

    // Determine which handle is closer
    const minDist = Math.abs(newValue - currentMin);
    const maxDist = Math.abs(newValue - currentMax);

    if (minDist < maxDist && newValue < currentMax) {
      onChange({ ...value, min: newValue });
    } else if (newValue > currentMin) {
      onChange({ ...value, max: newValue });
    }
  };

  const handleClear = () => {
    setMinInput("");
    setMaxInput("");
    onChange({ min: undefined, max: undefined });
  };

  const hasValue = value.min !== undefined || value.max !== undefined;
  const minPercentage = getPercentage(currentMin);
  const maxPercentage = getPercentage(currentMax);

  // Use same base classes as Input component
  const baseInputClasses =
    "w-20 px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm";

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-3">
        <div className="w-20">
          <input
            type="number"
            value={minInput}
            onChange={handleMinInputChange}
            placeholder={placeholder.min}
            className={baseInputClasses}
            step="0.01"
            min={minRange}
            max={maxRange}
          />
        </div>

        <div
          className="flex-1 relative"
          ref={sliderRef}>
          <div
            className="relative h-8 flex items-center cursor-pointer"
            onClick={handleSliderClick}>
            {/* Track */}
            <div className="absolute w-full h-2 bg-surface-hover rounded-lg"></div>

            {/* Active range */}
            <div
              className="absolute h-2 bg-primary rounded-lg"
              style={{
                left: `${minPercentage}%`,
                width: `${maxPercentage - minPercentage}%`,
              }}></div>

            {/* Min handle */}
            <div
              className="absolute w-4 h-4 bg-primary rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform z-10"
              style={{ left: `calc(${minPercentage}% - 8px)` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown("min");
              }}></div>

            {/* Max handle */}
            <div
              className="absolute w-4 h-4 bg-primary rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform z-10"
              style={{ left: `calc(${maxPercentage}% - 8px)` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown("max");
              }}></div>
          </div>
        </div>

        <div className="w-20">
          <input
            type="number"
            value={maxInput}
            onChange={handleMaxInputChange}
            placeholder={placeholder.max}
            className={baseInputClasses}
            step="0.01"
            min={minRange}
            max={maxRange}
          />
        </div>

        {hasValue && (
          <IconButton
            clicked={handleClear}
            className="text-text-muted hover:text-text p-1"
            aria-label="Clear range">
            <HiX className="w-4 h-4" />
          </IconButton>
        )}
      </div>
    </div>
  );
}
