import { BaseInput, IBaseInputProps } from "./input";

export type INumberInputProps = Omit<IBaseInputProps, "type"> & {
  min?: number;
  max?: number;
  step?: number | "any";
};

export function NumberInput({ min, max, step, ...props }: INumberInputProps) {
  return (
    <BaseInput
      type="number"
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
}
