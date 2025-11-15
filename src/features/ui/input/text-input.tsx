"use client";

import { Input, InputProps } from "./input";
import React from "react";

export type TextInputProps = Omit<InputProps, "type">;

export function TextInput(props: TextInputProps) {
  return <Input type="text" {...props} />;
}

