import type { ITransactionType } from "@/features/shared/validation/schemas";
import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
import {
  getFieldAriaDescribedBy,
  getFieldDescriptionIds,
} from "@/features/ui/form/field-aria";
import { EmoticonPicker } from "@/features/ui/input/emoticon-picker";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useId } from "react";

type ITagNameWithIconInputProps = IPropsWithClassName & {
  name?: string;
  emoticonName?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  transactionType?: ITransactionType;
};

export function TagNameWithIconInput({
  className,
  name = "name",
  emoticonName = "emoticon",
  label = "Name",
  required,
  disabled,
  transactionType,
}: ITagNameWithIconInputProps) {
  const generatedId = useId();
  const nameInputId = `${generatedId}-tag-name`;
  const { errorId, hintId } = getFieldDescriptionIds(nameInputId);

  const {
    borderClass: nameBorderClass,
    shouldShowError: nameHasError,
    error: nameError,
    renderWithController: renderNameField,
  } = useFieldAdapter({ name });

  const {
    borderClass: emoticonBorderClass,
    shouldShowError: emoticonHasError,
    error: emoticonError,
  } = useFieldAdapter({ name: emoticonName });

  const hasError = nameHasError || emoticonHasError;
  const borderClass = hasError
    ? nameBorderClass || emoticonBorderClass
    : "border-border";

  return renderNameField((currentNameField) => {
    const ariaDescribedBy = getFieldAriaDescribedBy({
      showError: nameHasError && !!nameError?.message,
      errorId,
      hintId,
    });
    const ariaInvalid = nameHasError && !!nameError?.message ? true : undefined;

    return (
      <div className={cn("space-y-1", className)}>
        <Label
          htmlFor={nameInputId}
          required={required}>
          {label}
        </Label>

        <div
          className={cn(
            "flex h-9 items-stretch overflow-hidden rounded-2xl border bg-surface hover:bg-surface-hover focus-within:ring-2 focus-within:ring-primary",
            borderClass,
            disabled && "opacity-50 cursor-not-allowed",
          )}>
          <EmoticonPicker
            name={emoticonName}
            disabled={disabled}
            transactionType={transactionType}
            variant="compact"
            embedded
          />

          <div
            className="w-px shrink-0 bg-border self-center h-5"
            aria-hidden
          />

          <input
            id={nameInputId}
            type="text"
            required={required}
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-text placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed"
            name={currentNameField.name}
            ref={currentNameField.ref}
            value={String(currentNameField.value ?? "")}
            onChange={currentNameField.onChange}
            onBlur={currentNameField.onBlur}
            placeholder="e.g. Food & Dining"
          />
        </div>

        {nameHasError && nameError?.message && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-danger mt-1">
            {nameError.message}
          </p>
        )}
        {!nameHasError && emoticonHasError && emoticonError?.message && (
          <p
            role="alert"
            className="text-sm text-danger mt-1">
            {emoticonError.message}
          </p>
        )}
      </div>
    );
  });
}
