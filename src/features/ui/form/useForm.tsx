import { type FieldValues, useForm, type UseFormProps } from "react-hook-form";

export function useFinForm<TFieldValues extends FieldValues>(
  props?: UseFormProps<TFieldValues>
) {
  return useForm<TFieldValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    ...props,
  });
}
