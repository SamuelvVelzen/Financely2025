"use client";

import { cn } from "@/util/cn";
import React, { useEffect, useId, useState } from "react";
import { Input, InputProps } from "./input";
import { TextInput } from "./text-input";

/**
 * Converts CSS color names (e.g., "red", "navy", "cornflowerblue") to hex codes
 * Also handles hex codes and returns them as-is
 */
function cssColorToHex(color: string): string {
  // If it's already a valid hex code, return it
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }

  // Try to convert CSS color name to hex
  if (typeof document === "undefined") {
    return color;
  }

  const tempDiv = document.createElement("div");
  tempDiv.style.color = color;
  document.body.appendChild(tempDiv);
  const computedColor = window.getComputedStyle(tempDiv).color;
  document.body.removeChild(tempDiv);

  // Parse rgb/rgba and convert to hex
  const rgbMatch = computedColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`.toUpperCase();
  }

  // If conversion failed, return the original input
  return color;
}

export type ColorInputProps = Omit<InputProps, "type" | "label"> & {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const ColorInput = React.forwardRef<HTMLInputElement, ColorInputProps>(
  ({ label, value, onChange, className, error, disabled, ...props }, ref) => {
    const generatedId = useId();
    const colorPickerId = `${generatedId}-color-picker`;
    const textInputId = `${generatedId}-text-input`;
    const [textValue, setTextValue] = useState(value);

    // Sync text value when external value changes (e.g., from color picker)
    useEffect(() => {
      setTextValue(value);
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Allow free typing - just update local state
      setTextValue(inputValue);
    };

    const handleTextBlur = () => {
      // Convert CSS color names to hex, or keep hex codes as-is when user finishes typing
      const hexColor = cssColorToHex(textValue);
      // Create a synthetic event with the converted hex color
      const syntheticEvent = {
        target: { value: hexColor },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    };

    const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Convert on Enter key as well
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    };

    const colorPicker = (
      <Input
        id={colorPickerId}
        type="color"
        label=""
        value={value}
        onChange={onChange}
        disabled={disabled}
        error={error}
        className={cn("w-16 h-10 cursor-pointer", className)}
        ref={ref}
        {...props}
      />
    );

    const textInput = (
      <TextInput
        id={textInputId}
        label=""
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        onKeyDown={handleTextKeyDown}
        disabled={disabled}
        error={error}
        placeholder="#000000 or red, navy, etc."
        className="flex-1"
      />
    );

    const content = (
      <div className="flex items-center gap-3">
        {colorPicker}
        {textInput}
      </div>
    );

    return (
      <div className="space-y-1">
        <label
          htmlFor={colorPickerId}
          className="block text-sm font-medium">
          {label}
        </label>
        {content}
      </div>
    );
  }
);

ColorInput.displayName = "ColorInput";
