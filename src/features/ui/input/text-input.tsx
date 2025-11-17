"use client";

import { Input, IInputProps } from "./input";
import React from "react";

export type ITextInputProps = Omit<IInputProps, "type">;

export function TextInput(props: ITextInputProps) {
  return <Input type="text" {...props} />;
}

