import React from "react";

export type ICheckboxGroupContext = {
  name: string;
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  disabled?: boolean;
  groupId: string;
};

export const CheckboxGroupContext =
  React.createContext<ICheckboxGroupContext | null>(null);
