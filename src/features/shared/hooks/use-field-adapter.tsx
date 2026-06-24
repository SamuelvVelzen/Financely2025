import React, { useMemo } from "react";
import type { FieldError, FieldErrors } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { useFormContextOptional } from "./use-form-context-optional";

function getFieldErrorByPath(
  errors: FieldErrors | undefined,
  path: string
): FieldError | undefined {
  if (!errors || !path) return undefined;
  const segments = path.split(".");
  let current: unknown = errors;
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  if (
    current &&
    typeof current === "object" &&
    "message" in current &&
    typeof (current as FieldError).message === "string"
  ) {
    return current as FieldError;
  }
  return undefined;
}

export type IFieldAdapterProps<TValue> = {
  name?: string;
  value?: TValue;
  onChange?: (value: TValue | undefined) => void;
  onValueChange?: (value: TValue | undefined) => void;
};

export type IUnifiedField<TValue> = {
  value: TValue | undefined;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  name: string;
  ref: (instance: unknown) => void;
};

export type IFieldAdapterResult<TValue> = {
  mode: "form" | "controlled";
  field: IUnifiedField<TValue>;
  error: { message?: string } | undefined;
  shouldShowError: boolean;
  borderClass: string;
  form: ReturnType<typeof useFormContextOptional>;
  renderWithController: <TProps extends Record<string, unknown>>(
    renderFn: (field: IUnifiedField<TValue>) => React.ReactElement<TProps>
  ) => React.ReactElement;
};

/**
 * Unified hook for handling both form mode and controlled mode inputs.
 * Provides a consistent interface regardless of the mode.
 *
 * @template TValue - The type of the field value
 * @param props - Field adapter props including name, value, onChange, onValueChange
 * @returns Field adapter result with unified field interface and rendering utilities
 */
export function useFieldAdapter<TValue>(
  props: IFieldAdapterProps<TValue>
): IFieldAdapterResult<TValue> {
  const { name, value: controlledValue, onChange: controlledOnChange, onValueChange } = props;
  const form = useFormContextOptional();

  // Detect mode: form mode if form context exists AND name is provided
  const isFormMode = form !== null && name !== undefined;
  // Controlled mode if not in form mode and controlled props are provided
  const isControlledMode =
    !isFormMode &&
    (controlledValue !== undefined || controlledOnChange !== undefined);

  const mode = isFormMode ? "form" : "controlled";

  // Extract error state (only relevant in form mode)
  const error = useMemo(() => {
    if (isFormMode && form && name) {
      return getFieldErrorByPath(form.formState.errors, name);
    }
    return undefined;
  }, [isFormMode, form, name]);

  const shouldShowError = useMemo(() => {
    if (isFormMode && form) {
      return !!error && form.formState.isSubmitted;
    }
    return false;
  }, [isFormMode, form, error]);

  const borderClass = useMemo(() => {
    return shouldShowError ? "border-danger" : "border-border";
  }, [shouldShowError]);

  const formControl = form?.control;
  const watchedFormValue = useWatch({
    control: formControl,
    name: (name ?? "") as never,
    disabled: !isFormMode || !formControl || !name,
  });
  const formValue =
    isFormMode && form && name ? (watchedFormValue as TValue | undefined) : undefined;

  // Create unified field interface
  const field: IUnifiedField<TValue> = useMemo(() => {
    if (isControlledMode) {
      // Controlled mode: create mock field
      return {
        value: controlledValue,
        onChange: (value: unknown) => {
          // Handle both event objects and direct values
          let extractedValue: TValue | undefined;
          if (value && typeof value === "object" && "target" in value) {
            // It's an event object - extract value
            const event = value as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
            extractedValue = event.target.value as TValue | undefined;
          } else {
            // It's a direct value
            extractedValue = value as TValue | undefined;
          }
          controlledOnChange?.(extractedValue);
          onValueChange?.(extractedValue);
        },
        onBlur: () => { },
        name: name || "",
        ref: () => { },
      };
    } else {
      // Form mode: use form.watch for value, onChange will be provided by Controller
      return {
        value: formValue as TValue | undefined,
        onChange: (value: unknown) => {
          // This will be replaced by Controller's onChange, but provide a fallback
          if (form && name) {
            let extractedValue: TValue | undefined;
            if (value && typeof value === "object" && "target" in value) {
              const event = value as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
              extractedValue = event.target.value as TValue | undefined;
            } else {
              extractedValue = value as TValue | undefined;
            }
            form.setValue(name, extractedValue);
            onValueChange?.(extractedValue);
          }
        },
        onBlur: () => { },
        name: name || "",
        ref: () => { },
      };
    }
  }, [isControlledMode, controlledValue, controlledOnChange, onValueChange, name, form, formValue]);

  // Render function that handles Controller wrapping
  const renderWithController = <TProps extends Record<string, unknown>>(
    renderFn: (field: IUnifiedField<TValue>) => React.ReactElement<TProps>
  ): React.ReactElement => {
    if (isControlledMode) {
      // Controlled mode: render directly with the mock field
      return renderFn(field);
    }

    // Form mode: wrap with Controller
    if (!form || !name) {
      throw new Error(
        `useFieldAdapter: Form mode requires 'name' prop and form context. ` +
        `Either provide 'name' prop with form context, or provide 'value' and 'onChange' props for controlled mode.`
      );
    }

    return (
      <Controller
        name={name}
        control={form.control}
        render={({ field: controllerField, fieldState: _fieldState }) => {
          // Merge controller field with our unified interface
          const unifiedField: IUnifiedField<TValue> = {
            value: controllerField.value as TValue | undefined,
            onChange: (value: unknown) => {
              // Handle both event objects and direct values
              let extractedValue: TValue | undefined;
              if (value && typeof value === "object" && "target" in value) {
                // It's an event object - extract value
                const event = value as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
                extractedValue = event.target.value as TValue | undefined;
              } else {
                // It's a direct value
                extractedValue = value as TValue | undefined;
              }
              controllerField.onChange(extractedValue);
              onValueChange?.(extractedValue);
            },
            onBlur: controllerField.onBlur,
            name: controllerField.name,
            ref: controllerField.ref,
          };

          return renderFn(unifiedField);
        }}
      />
    );
  };

  return {
    mode,
    field,
    error,
    shouldShowError,
    borderClass,
    form,
    renderWithController,
  };
}
