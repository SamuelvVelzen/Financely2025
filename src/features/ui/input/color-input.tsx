"use client";

import {
  IFormOrControlledMode,
  useFormContextOptional,
} from "@/features/shared/hooks/use-form-context-optional";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useId, useState } from "react";
import { Controller } from "react-hook-form";

/**
 * Converts CSS color names (e.g., "red", "navy", "cornflowerblue") to hex codes
 * Also handles hex codes and returns them as-is
 */
function cssColorToHex(color: string): string {
  // If it's already a valid hex code, return it
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }

  if (!color) {
    return "";
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

export type IColorInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "name" | "type" | "value" | "onChange" | "defaultValue"
> &
  IPropsWithClassName & {
    label: string;
    id?: string;
  } & IFormOrControlledMode<string>;

export function ColorInput({
  label,
  name,
  id,
  className,
  disabled,
  value: controlledValue,
  onChange: controlledOnChange,
  ...props
}: IColorInputProps) {
  const generatedId = useId();
  const colorPickerId = id || `${generatedId}-color-picker`;
  const textInputId = `${generatedId}-text-input`;
  const form = useFormContextOptional();

  // Determine mode
  const isFormMode = !!name && !!form;
  const isControlledMode =
    controlledValue !== undefined && !!controlledOnChange;

  // Initialize text value
  const [textValue, setTextValue] = useState<string>(() => {
    if (isControlledMode && controlledValue !== undefined) {
      return String(controlledValue || "");
    }
    if (isFormMode && form) {
      const formValue = form.getValues(name);
      return String(formValue || "");
    }
    return "";
  });

  const baseClasses =
    "w-full px-3 py-2 border rounded-2xl bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";

  // Shared rendering logic
  const renderColorInput = (
    currentValue: string,
    onChange: (value: string) => void,
    borderClass: string,
    showError?: boolean,
    errorMessage?: string
  ) => {
    // Sync text value when value changes from outside
    if (
      currentValue !== textValue &&
      document.activeElement?.id !== textInputId
    ) {
      setTextValue(currentValue);
    }

    const displayTextValue: string = textValue || "";

    const handleColorPickerChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const newValue = e.target.value;
      onChange(newValue);
      setTextValue(newValue);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Allow free typing - just update local state
      setTextValue(inputValue);
    };

    const handleTextBlur = () => {
      // Convert CSS color names to hex, or keep hex codes as-is when user finishes typing
      const hexColor = cssColorToHex(textValue || "");
      onChange(hexColor);
      setTextValue(hexColor);
    };

    const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          <div
            className={cn(
              "rounded-2xl overflow-hidden shrink-0 w-16 h-[2.47rem]"
            )}>
            <input
              type="color"
              id={colorPickerId}
              value={currentValue || "#000000"}
              onChange={handleColorPickerChange}
              disabled={disabled}
              className={cn(
                "w-full h-full cursor-pointer border-0 rounded-2xl appearance-none",
                "[-webkit-appearance:none]",
                "[&::-webkit-color-swatch]:border-0",
                "[&::-webkit-color-swatch]:rounded-2xl",
                "[&::-moz-color-swatch]:border-0",
                "[&::-moz-color-swatch]:rounded-2xl",
                className
              )}
              style={{
                padding: 0,
                margin: 0,
              }}
              {...(props as Omit<
                React.InputHTMLAttributes<HTMLInputElement>,
                "id" | "name" | "type" | "value" | "onChange" | "defaultValue"
              >)}
            />
          </div>
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
        {showError && errorMessage && (
          <p className="text-sm text-danger mt-1">{errorMessage}</p>
        )}
      </div>
    );
  };

  // Render controlled mode
  if (isControlledMode) {
    return renderColorInput(
      controlledValue || "",
      (value) => controlledOnChange?.(value),
      "border-border"
    );
  }

  // Render form mode
  if (isFormMode && form) {
    return (
      <Controller
        name={name}
        control={form.control}
        render={({ field, fieldState }) => {
          const error = fieldState.error;
          const shouldShowError = error && form.formState.isSubmitted;
          const borderClass = shouldShowError
            ? "border-danger"
            : "border-border";
          const currentFieldValue: string = String(field.value || "");

          return renderColorInput(
            currentFieldValue,
            field.onChange,
            borderClass,
            shouldShowError,
            error?.message as string | undefined
          );
        }}
      />
    );
  }

  // Fallback (should not happen with proper discriminated union)
  return null;
}
