"use client";

import { Input, InputProps } from "./input";

export type DateInputProps = Omit<InputProps, "type"> & {
  type?: "date" | "datetime-local";
};

export function DateInput({ type = "date", ...props }: DateInputProps) {
  return (
    <Input
      type={type}
      {...props}
    />
  );
}
