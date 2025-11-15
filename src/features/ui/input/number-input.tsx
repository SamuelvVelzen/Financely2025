"use client";

import { Input, InputProps } from "./input";

export type NumberInputProps = Omit<InputProps, "type"> & {
  min?: number;
  max?: number;
  step?: number | "any";
};

export function NumberInput({ min, max, step, ...props }: NumberInputProps) {
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
