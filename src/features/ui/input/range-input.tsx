import { IconButton } from "@/features/ui/button/icon-button";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useEffect, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { HiX } from "react-icons/hi";
import { useFinForm } from "../form/useForm";

export type IPriceRange = {
  min?: number;
  max?: number;
};

export type IRangeInputProps = IPropsWithClassName & {
  value: IPriceRange;
  onChange: (range: IPriceRange) => void;
  minRange?: number;
  maxRange?: number;
  label?: string;
  required?: boolean;
};

export function RangeInput({
  className = "",
  value,
  onChange,
  minRange = 0,
  maxRange = 1000,
  label,
  required,
}: IRangeInputProps) {
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const decimalForm = useFinForm<{ min: string; max: string }>({
    defaultValues: {
      min: value.min?.toString() ?? "",
      max: value.max?.toString() ?? "",
    },
  });

  // Sync decimal form with value prop
  useEffect(() => {
    decimalForm.setValue("min", value.min?.toString() ?? "", {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    decimalForm.setValue("max", value.max?.toString() ?? "", {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [value.min, value.max, decimalForm]);

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

  const handleMinDecimalChange = (normalized: string) => {
    if (!normalized) {
      onChange({ ...value, min: undefined });
      return;
    }
    let minValue = parseFloat(normalized);
    if (Number.isNaN(minValue)) {
      return;
    }
    minValue = Math.max(minValue, minRange);
    if (value.max !== undefined && minValue >= value.max) {
      onChange({ ...value, min: value.max - 1 });
    } else {
      onChange({ ...value, min: minValue });
    }
  };

  const handleMaxDecimalChange = (normalized: string) => {
    if (!normalized) {
      onChange({ ...value, max: undefined });
      return;
    }
    let maxValue = parseFloat(normalized);
    if (Number.isNaN(maxValue)) {
      return;
    }
    maxValue = Math.max(maxValue, minRange);
    if (value.min !== undefined && maxValue <= value.min) {
      onChange({ ...value, max: value.min + 1 });
    } else {
      onChange({ ...value, max: maxValue });
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
    decimalForm.reset({ min: "", max: "" });
    onChange({ min: undefined, max: undefined });
  };

  const hasValue = value.min !== undefined || value.max !== undefined;
  const minPercentage = getPercentage(sliderMin);
  const maxPercentage = getPercentage(sliderMax);

  const inputWrapperClasses = "w-24";

  return (
    <FormProvider {...decimalForm}>
      <div className={cn("relative", label ? "space-y-1" : "", className)}>
        {label && <Label required={required}>{label}</Label>}
        <div className="flex flex-col gap-3">
          {/* Slider on top */}
          <div
            className="relative"
            ref={sliderRef}>
            <div
              className="relative h-8 flex items-center cursor-pointer"
              onClick={handleSliderClick}>
              {/* Track */}
              <div className="absolute w-full h-2 bg-surface-hover rounded-2xl"></div>

              {/* Active range */}
              <div
                className="absolute h-2 bg-primary rounded-2xl"
                style={{
                  left: `${minPercentage}%`,
                  width: `${maxPercentage - minPercentage}%`,
                }}></div>

              {/* Min handle */}
              <div
                className="absolute size-4 bg-primary rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform z-10"
                style={{ left: `calc(${minPercentage}% - 8px)` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown("min");
                }}></div>

              {/* Max handle */}
              <div
                className="absolute size-4 bg-primary rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform z-10"
                style={{ left: `calc(${maxPercentage}% - 8px)` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown("max");
                }}></div>
            </div>
          </div>

          {/* Inputs below slider */}
          <div className="relative flex items-center justify-between gap-3">
            <div className={inputWrapperClasses}>
              <DecimalInput
                name="min"
                onValueChange={handleMinDecimalChange}
                placeholder={minRange}
              />
            </div>

            {hasValue && (
              <IconButton
                clicked={handleClear}
                className="absolute left-1/2 -translate-x-1/2 text-text-muted hover:text-text p-1"
                aria-label="Clear range">
                <HiX className="size-4" />
              </IconButton>
            )}

            <div className={inputWrapperClasses}>
              <DecimalInput
                name="max"
                onValueChange={handleMaxDecimalChange}
                placeholder={maxRange}
              />
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
