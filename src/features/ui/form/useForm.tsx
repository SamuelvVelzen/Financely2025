import { FieldValues, useForm, UseFormProps } from "react-hook-form";

export function useFinForm<TFieldValues extends FieldValues>(
  props?: Omit<UseFormProps<TFieldValues>, "mode" | "reValidateMode">
) {
  return useForm<TFieldValues>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    ...props,
  });
}
