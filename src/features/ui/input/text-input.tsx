"use client";

import { Input, InputProps } from "./input";
import React from "react";

export type TextInputProps = Omit<InputProps, "type">;

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (props, ref) => {
    return <Input type="text" ref={ref} {...props} />;
  }
);

TextInput.displayName = "TextInput";

