import {
  type IFormOrControlledMode,
} from "@/features/shared/hooks/use-form-context-optional";
import type { ITransactionType } from "@/features/shared/validation/schemas";
import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
import { EmoticonPicker } from "@/features/ui/input/emoticon-picker";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useId } from "react";

type IEmoticonInputProps = IPropsWithClassName & {
  label?: string;
  hint?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
  transactionType?: ITransactionType;
} & IFormOrControlledMode<string>;

export function EmoticonInput({
  className,
  label,
  hint,
  required,
  name,
  id,
  disabled,
  transactionType,
  value: controlledValue,
  onChange: controlledOnChange,
  onValueChange,
}: IEmoticonInputProps) {
  const generatedId = useId();
  const triggerId = id || `${generatedId}-emoticon-trigger`;

  const { mode, shouldShowError, error } = useFieldAdapter({
    name,
    value: controlledValue,
    onChange: controlledOnChange,
    onValueChange,
  });

  const pickerProps =
    mode === "form" && name
      ? { name, disabled, transactionType, variant: "standalone" as const }
      : {
          value: controlledValue ?? "",
          onChange: controlledOnChange!,
          disabled,
          transactionType,
          variant: "standalone" as const,
          onValueChange,
        };

  return (
    <div className={cn("relative space-y-1", className)}>
      {label && (
        <Label
          htmlFor={triggerId}
          required={required}>
          {label}
        </Label>
      )}

      <EmoticonPicker {...pickerProps} />

      {shouldShowError && error?.message && (
        <p className="text-sm text-danger mt-1">{error.message}</p>
      )}
      {!shouldShowError && hint && (
        <p className="text-xs text-text-muted mt-1">{hint}</p>
      )}
    </div>
  );
}
