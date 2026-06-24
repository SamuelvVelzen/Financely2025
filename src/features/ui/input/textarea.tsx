import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
import { type IFormOrControlledMode } from "@/features/shared/hooks/use-form-context-optional";
import {
  getFieldAriaDescribedBy,
  getFieldDescriptionIds,
} from "@/features/ui/form/field-aria";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { forwardRef, useId } from "react";
import type { ControllerRenderProps } from "react-hook-form";

type RenderFieldParams = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
};

export type IBaseTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
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
  } & IFormOrControlledMode<string>;

export const BaseTextarea = forwardRef<HTMLTextAreaElement, IBaseTextareaProps>(
  (
    {
      className,
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
    const { errorId, hintId } = getFieldDescriptionIds(inputId);

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

    const formModeProps =
      mode === "form"
        ? { ...props, value: undefined, onChange: undefined }
        : props;

    const baseClasses =
      "border rounded-2xl bg-surface text-text hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed w-full resize-y min-h-24";

    const paddingClasses = cn(
      "py-2",
      prefixIcon ? "pl-9" : "pl-2",
      suffixIcon ? "pr-9" : "pr-2"
    );

    const renderTextareaContent = (
      currentField: typeof field,
      textareaRef?: React.Ref<HTMLTextAreaElement>
    ) => {
      const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        currentField.onChange(e);
      };

      const hasError = shouldShowError && !!error?.message;
      const ariaDescribedBy = getFieldAriaDescribedBy({
        showError: hasError,
        errorId,
        hint,
        hintId,
      });
      const ariaInvalid = hasError ? true : undefined;

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
              <div className="absolute left-2 top-3 text-text pointer-events-none">
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
                textareaProps: {
                  id: inputId,
                  required,
                  "aria-invalid": ariaInvalid,
                  "aria-describedby": ariaDescribedBy,
                  className: cn(
                    baseClasses,
                    borderClass,
                    paddingClasses,
                    className
                  ),
                  ...props,
                },
              })
            ) : (
              <textarea
                id={inputId}
                required={required}
                aria-invalid={ariaInvalid}
                aria-describedby={ariaDescribedBy}
                className={cn(
                  baseClasses,
                  borderClass,
                  paddingClasses,
                  className
                )}
                name={currentField.name}
                ref={
                  textareaRef ||
                  (currentField.ref as React.Ref<HTMLTextAreaElement>)
                }
                {...(mode === "controlled" ? props : formModeProps)}
                value={String(currentField.value ?? "")}
                onChange={handleChange}
                onBlur={currentField.onBlur}
              />
            )}
            {suffixIcon && (
              <div className="absolute right-2 top-3 text-text flex">
                {suffixIcon}
              </div>
            )}
          </div>
          {hasError && (
            <p
              id={errorId}
              role="alert"
              className="text-sm text-danger mt-1">
              {error.message}
            </p>
          )}
          {!hasError && hint && (
            <p
              id={hintId}
              className="text-xs text-text-muted mt-1">
              {hint}
            </p>
          )}
        </div>
      );
    };

    return renderWithController((currentField) => {
      return renderTextareaContent(currentField, ref);
    });
  }
);

export type ITextareaProps = IBaseTextareaProps;

export function Textarea({ ...props }: ITextareaProps) {
  return <BaseTextarea {...props} />;
}
