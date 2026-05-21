import { BaseInput, type ITextInputProps } from "./input";

export type { ITextInputProps };

export function TextInput({ ...props }: ITextInputProps) {
  return (
    <BaseInput
      type="text"
      {...props}
    />
  );
}
