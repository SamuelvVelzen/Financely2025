"use client";

import { Input, IInputProps } from "./input";

export type INumberInputProps = Omit<IInputProps, "type"> & {
  min?: number;
  max?: number;
  step?: number | "any";
};

export function NumberInput({ min, max, step, ...props }: INumberInputProps) {
  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
}
