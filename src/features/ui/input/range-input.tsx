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
  maxRange = 1000,
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

  const sliderMin = Math.max(minRange, Math.min(currentMin, maxRange));
  const sliderMax = Math.max(sliderMin + 1, Math.min(currentMax, maxRange));

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
      const clampedValue = Math.min(newValue, sliderMax - 1);
      onChange({ ...value, min: clampedValue });
    } else {
      const clampedValue = Math.max(newValue, sliderMin + 1);
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
  }, [isDragging, sliderMin, sliderMax, value]);

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMinInput(inputValue);
    const minValue = inputValue ? parseFloat(inputValue) : undefined;
    if (minValue !== undefined && !isNaN(minValue)) {
      if (value.max !== undefined && minValue >= value.max) {
        onChange({ ...value, min: value.max - 1 });
      } else {
        onChange({ ...value, min: minValue });
      }
    } else if (inputValue === "") {
      onChange({ ...value, min: undefined });
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMaxInput(inputValue);
    const maxValue = inputValue ? parseFloat(inputValue) : undefined;
    if (maxValue !== undefined && !isNaN(maxValue)) {
      if (value.min !== undefined && maxValue <= value.min) {
        onChange({ ...value, max: value.min + 1 });
      } else {
        onChange({ ...value, max: maxValue });
      }
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
    const minDist = Math.abs(newValue - sliderMin);
    const maxDist = Math.abs(newValue - sliderMax);

    if (minDist < maxDist && newValue < sliderMax) {
      onChange({ ...value, min: newValue });
    } else if (newValue > sliderMin) {
      onChange({ ...value, max: newValue });
    }
  };

  const handleClear = () => {
    setMinInput("");
    setMaxInput("");
    onChange({ min: undefined, max: undefined });
  };

  const hasValue = value.min !== undefined || value.max !== undefined;
  const minPercentage = getPercentage(sliderMin);
  const maxPercentage = getPercentage(sliderMax);

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
          />
        </div>

        <div className="flex-1 relative" ref={sliderRef}>
          <div
            className="relative h-8 flex items-center cursor-pointer"
            onClick={handleSliderClick}
          >
            {/* Track */}
            <div className="absolute w-full h-2 bg-surface-hover rounded-lg"></div>

            {/* Active range */}
            <div
              className="absolute h-2 bg-primary rounded-lg"
              style={{
                left: `${minPercentage}%`,
                width: `${maxPercentage - minPercentage}%`,
              }}
            ></div>

            {/* Min handle */}
            <div
              className="absolute w-4 h-4 bg-primary rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform z-10"
              style={{ left: `calc(${minPercentage}% - 8px)` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown("min");
              }}
            ></div>

            {/* Max handle */}
            <div
              className="absolute w-4 h-4 bg-primary rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform z-10"
              style={{ left: `calc(${maxPercentage}% - 8px)` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown("max");
              }}
            ></div>
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
          />
        </div>

        {hasValue && (
          <IconButton
            clicked={handleClear}
            className="text-text-muted hover:text-text p-1"
            aria-label="Clear range"
          >
            <HiX className="w-4 h-4" />
          </IconButton>
        )}
      </div>
    </div>
  );
}
