import { BaseInput, IBaseInputProps } from "./input";
import { forwardRef } from "react";

export type IDateInputProps = Omit<IBaseInputProps, "type"> & {
  type?: "date" | "datetime-local";
};

export const DateInput = forwardRef<HTMLInputElement, IDateInputProps>(
  ({ type = "date", ...props }, ref) => {
    return (
      <BaseInput
        ref={ref}
        type={type}
        {...props}
      />
    );
  }
);
