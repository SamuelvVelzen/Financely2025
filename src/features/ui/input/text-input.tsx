"use client";

import React from "react";
import { BaseInput, IBaseInputProps } from "./input";

export type ITextInputProps = IBaseInputProps & {
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
};

export function TextInput({ type = "text", ...props }: ITextInputProps) {
  return <BaseInput type={type} {...props} />;
}
