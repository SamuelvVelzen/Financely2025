"use client";

import { BaseInput, IBaseInputProps } from "./input";
import React from "react";

export type ITextInputProps = Omit<IBaseInputProps, "type">;

export function TextInput(props: ITextInputProps) {
  return <BaseInput type="text" {...props} />;
}

