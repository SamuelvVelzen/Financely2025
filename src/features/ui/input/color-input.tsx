"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import React, { useId, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

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

export type ColorInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "name" | "type"
> &
  PropsWithClassName & {
    name: string;
    label: string;
    id?: string;
  };

export function ColorInput({
  label,
  name,
  id,
  className,
  disabled,
  ...props
}: ColorInputProps) {
  const generatedId = useId();
  const colorPickerId = id || `${generatedId}-color-picker`;
  const textInputId = `${generatedId}-text-input`;
  const form = useFormContext();
  const error = form.formState.errors[name];
  const [textValue, setTextValue] = useState("");

  const baseClasses =
    "w-full px-3 py-2 border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const borderClass = error ? "border-danger" : "border-border";

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => {
        const currentFieldValue = field.value || "";

        // Sync text value when field value changes from outside (e.g., form reset)
        // Only sync if text input is not currently focused
        if (
          currentFieldValue !== textValue &&
          document.activeElement?.id !== textInputId
        ) {
          setTextValue(currentFieldValue);
        }

        const displayTextValue = textValue || currentFieldValue || "";

        const handleColorPickerChange = (
          e: React.ChangeEvent<HTMLInputElement>
        ) => {
          const newValue = e.target.value;
          field.onChange(newValue);
          setTextValue(newValue);
        };

        const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const inputValue = e.target.value;
          // Allow free typing - just update local state
          setTextValue(inputValue);
        };

        const handleTextBlur = () => {
          // Convert CSS color names to hex, or keep hex codes as-is when user finishes typing
          const hexColor = cssColorToHex(textValue);
          field.onChange(hexColor);
          setTextValue(hexColor);
        };

        const handleTextKeyDown = (
          e: React.KeyboardEvent<HTMLInputElement>
        ) => {
          // Convert on Enter key as well
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        };

        return (
          <div className={label ? "space-y-1" : ""}>
            {label && (
              <label
                htmlFor={colorPickerId}
                className="block text-sm font-medium">
                {label}
              </label>
            )}
            <div className="flex items-center gap-3">
              {/* Color Picker */}
              <input
                type="color"
                id={colorPickerId}
                value={currentFieldValue || "#000000"}
                onChange={handleColorPickerChange}
                disabled={disabled}
                className={cn(
                  "w-16 h-10 cursor-pointer rounded-lg border",
                  borderClass,
                  className
                )}
                {...props}
              />
              {/* Text Input */}
              <input
                type="text"
                id={textInputId}
                value={displayTextValue}
                onChange={handleTextChange}
                onBlur={handleTextBlur}
                onKeyDown={handleTextKeyDown}
                disabled={disabled}
                placeholder="#000000 or red, navy, etc."
                className={cn(baseClasses, borderClass, "flex-1")}
              />
            </div>
            {error && (
              <p className="text-sm text-danger mt-1">
                {error.message as string}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
