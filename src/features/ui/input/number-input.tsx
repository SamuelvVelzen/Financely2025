import { BaseInput, type INumberInputProps } from "./input";

export type { INumberInputProps };

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
