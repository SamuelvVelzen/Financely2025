import { BaseInput, IBaseInputProps } from "./input";

export type ITextInputProps = Omit<IBaseInputProps, "type">;

export function TextInput({ ...props }: ITextInputProps) {
  return (
    <BaseInput
      type="text"
      {...props}
    />
  );
}
