import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
import { IFormOrControlledMode } from "@/features/shared/hooks/use-form-context-optional";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { forwardRef, useId } from "react";
import type { ControllerRenderProps } from "react-hook-form";

type RenderFieldParams = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
};

export type IBaseInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "name" | "value" | "onChange"
> &
  IPropsWithClassName & {
    label?: string;
    hint?: string;
    required?: boolean;
    id?: string;
    prefixIcon?: React.ReactNode;
    suffixIcon?: React.ReactNode;
    renderField?: (params: RenderFieldParams) => React.ReactNode;
  } & IFormOrControlledMode<string | number>;

export const BaseInput = forwardRef<HTMLInputElement, IBaseInputProps>(
  (
    {
      className,
      type,
      label,
      hint,
      required,
      name,
      id,
      prefixIcon,
      suffixIcon,
      renderField,
      value: controlledValue,
      onChange: controlledOnChange,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const {
      field,
      borderClass,
      shouldShowError,
      error,
      mode,
      renderWithController,
    } = useFieldAdapter({
      name,
      value: controlledValue,
      onChange: controlledOnChange,
      onValueChange,
    });

    // Exclude controlled mode props from props when in form mode to avoid conflicts
    const formModeProps =
      mode === "form"
        ? { ...props, value: undefined, onChange: undefined }
        : props;

    const baseClasses =
      "border rounded-2xl bg-surface text-text hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed w-full";
    const widthBaseClasses = `h-9`;

    // Adjust padding based on icons
    const paddingClasses = cn(
      "py-2",
      prefixIcon ? "pl-9" : "pl-2",
      suffixIcon ? "pr-9" : "pr-2"
    );

    // Shared rendering logic
    const renderInputContent = (
      currentField: typeof field,
      inputRef?: React.Ref<HTMLInputElement>
    ) => {
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        currentField.onChange(e);
      };

      return (
        <div className={label || hint ? "space-y-1" : ""}>
          {label && (
            <Label
              htmlFor={inputId}
              required={required}>
              {label}
            </Label>
          )}
          <div className="relative">
            {prefixIcon && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-text pointer-events-none">
                {prefixIcon}
              </div>
            )}
            {renderField ? (
              renderField({
                field: {
                  value: currentField.value,
                  onChange: handleChange,
                  onBlur: currentField.onBlur,
                  name: currentField.name,
                  ref: currentField.ref,
                } as ControllerRenderProps<Record<string, unknown>, string>,
                inputProps: {
                  type,
                  id: inputId,
                  required,
                  className: cn(
                    baseClasses,
                    borderClass,
                    paddingClasses,
                    widthBaseClasses,
                    className
                  ),
                  ...props,
                },
              })
            ) : (
              <input
                type={type}
                id={inputId}
                required={required}
                className={cn(
                  baseClasses,
                  borderClass,
                  paddingClasses,
                  widthBaseClasses,
                  className
                )}
                name={currentField.name}
                ref={
                  inputRef || (currentField.ref as React.Ref<HTMLInputElement>)
                }
                {...(mode === "controlled" ? props : formModeProps)}
                value={String(currentField.value ?? "")}
                onChange={handleChange}
                onBlur={currentField.onBlur}
              />
            )}
            {suffixIcon && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-text flex">
                {suffixIcon}
              </div>
            )}
          </div>
          {shouldShowError && error?.message && (
            <p className="text-sm text-danger mt-1">{error.message}</p>
          )}
          {!shouldShowError && hint && (
            <p className="text-xs text-text-muted mt-1">{hint}</p>
          )}
        </div>
      );
    };

    // Render using the adapter
    return renderWithController((currentField) => {
      return renderInputContent(currentField, ref);
    });
  }
);
