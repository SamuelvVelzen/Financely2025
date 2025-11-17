"use client";

import { Input, IInputProps } from "./input";

export type IDateInputProps = Omit<IInputProps, "type"> & {
  type?: "date" | "datetime-local";
};

export function DateInput({ type = "date", ...props }: IDateInputProps) {
  return (
    <Input
      type={type}
      {...props}
    />
  );
}
