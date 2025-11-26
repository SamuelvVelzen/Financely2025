import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/features/ui/form/form";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import {
  BANK_OPTIONS,
  DEFAULT_BANK_OPTION_PLACEHOLDER,
  type BankEnum,
} from "../config/banks";

type BankSelectForm = {
  bank?: BankEnum;
};

type BankSelectProps = {
  value: BankEnum | null;
  onChange: (bank: BankEnum | null) => void;
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
  const form = useForm<BankSelectForm>({
    defaultValues: {
      bank: value || undefined,
    },
  });

  useEffect(() => {
    form.setValue("bank", value || undefined, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form, value]);

  useEffect(() => {
    const subscription = form.watch((data) => {
      onChange(data.bank || null);
    });

    return () => subscription.unsubscribe();
  }, [form, name, onChange]);

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <Form form={form} onSubmit={async () => undefined}>
        <SelectDropdown
          name="bank"
          label={label}
          placeholder={DEFAULT_BANK_OPTION_PLACEHOLDER}
          options={BANK_OPTIONS}
          multiple={false}
        />
      </Form>
      {helperText && (
        <p className="text-xs text-text-muted mt-1">{helperText}</p>
      )}
    </div>
  );
}

