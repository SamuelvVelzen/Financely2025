"use client";

import { BaseInput, IBaseInputProps } from "./input";

export type IDateInputProps = Omit<IBaseInputProps, "type"> & {
  type?: "date" | "datetime-local";
};

export function DateInput({ type = "date", ...props }: IDateInputProps) {
  return (
    <BaseInput
      type={type}
      {...props}
    />
  );
}
