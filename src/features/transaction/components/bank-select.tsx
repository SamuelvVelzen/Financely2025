import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { useEffect } from "react";
import {
  BANK_OPTIONS,
  DEFAULT_BANK_OPTION_PLACEHOLDER,
  type BankEnum,
} from "../config/banks";

type BankSelectForm = {
  bank?: BankEnum;
};

type BankSelectProps = {
  value: BankEnum;
  onChange: (bank: BankEnum) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
};

export function BankSelect({
  value,
  onChange,
  disabled = false,
  label = "Bank profile",
  helperText,
}: BankSelectProps) {
  const form = useFinForm<BankSelectForm>({
    defaultValues: {
      bank: value,
    },
  });

  useEffect(() => {
    form.setValue("bank", value, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form, value]);

  useEffect(() => {
    const subscription = form.watch((data) => {
      // Since bank is required, data.bank should always be defined
      // But we provide a fallback to DEFAULT to ensure we always have a value
      onChange(data.bank || "DEFAULT");
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <Form
        form={form}
        onSubmit={async () => undefined}>
        <SelectDropdown
          name="bank"
          label={label}
          placeholder={DEFAULT_BANK_OPTION_PLACEHOLDER}
          options={BANK_OPTIONS}
          multiple={false}
          required={true}
          clearable={false}
        />
      </Form>
      {helperText && (
        <p className="text-xs text-text-muted mt-1">{helperText}</p>
      )}
    </div>
  );
}
