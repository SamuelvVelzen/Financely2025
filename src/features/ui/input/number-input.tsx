"use client";

import { Input, InputProps } from "./input";
import React from "react";

export type NumberInputProps = Omit<InputProps, "type"> & {
  min?: number;
  max?: number;
  step?: number | "any";
};

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ min, max, step, ...props }, ref) => {
    return (
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        ref={ref}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

