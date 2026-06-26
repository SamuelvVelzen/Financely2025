import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useCallback, useId, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { RadioGroupContext, type IRadioGroupContext } from "./radio-group-context";

export type IRadioGroupProps = IPropsWithClassName & {
  name: string;
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

export function RadioGroup({
  className,
  name,
  label,
  hint,
  required,
  disabled = false,
  children,
}: IRadioGroupProps) {
  const generatedId = useId();
  const groupId = `radio-group-${generatedId}`;
  const form = useFormContext();
  const error = form.formState.errors[name];
  const itemOrderRef = useRef<string[]>([]);
  const itemElementsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  const registerItem = useCallback(
    (value: string, element: HTMLButtonElement | null) => {
      if (element) {
        if (!itemOrderRef.current.includes(value)) {
          itemOrderRef.current.push(value);
        }
        itemElementsRef.current.set(value, element);
        return;
      }

      itemOrderRef.current = itemOrderRef.current.filter((item) => item !== value);
      itemElementsRef.current.delete(value);
    },
    []
  );

  const getItems = useCallback(() => [...itemOrderRef.current], []);

  const getItemElement = useCallback(
    (value: string) => itemElementsRef.current.get(value),
    []
  );

  const focusItem = useCallback((value: string) => {
    itemElementsRef.current.get(value)?.focus();
  }, []);

  const baseClasses = "space-y-1 w-full flex flex-wrap gap-3";

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => {
        const contextValue: IRadioGroupContext = {
          name: field.name,
          value: field.value,
          onChange: field.onChange,
          disabled,
          groupId,
          registerItem,
          getItems,
          getItemElement,
          focusItem,
        };

        const fieldsetId = `${groupId}-fieldset`;
        const legendId = label ? `${groupId}-legend` : undefined;
        const errorId = error ? `${groupId}-error` : undefined;
        const hintId = hint ? `${groupId}-hint` : undefined;

        return (
          <div className={cn(baseClasses, className)}>
            <fieldset
              id={fieldsetId}
              className="border-0 p-0 m-0"
              aria-describedby={cn(
                errorId,
                hintId && !errorId ? hintId : undefined
              )}>
              {label && (
                <legend
                  id={legendId}
                  className="mb-2">
                  <Label
                    htmlFor={undefined}
                    required={required}>
                    {label}
                  </Label>
                </legend>
              )}
              <div
                role="radiogroup"
                aria-labelledby={legendId}
                aria-orientation={"horizontal"}>
                <RadioGroupContext.Provider value={contextValue}>
                  {children}
                </RadioGroupContext.Provider>
              </div>
            </fieldset>
            {error && (
              <p
                id={errorId}
                className="text-sm text-danger mt-1"
                role="alert">
                {error.message as string}
              </p>
            )}
            {!error && hint && (
              <p
                id={hintId}
                className="text-xs text-text-muted mt-1">
                {hint}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
