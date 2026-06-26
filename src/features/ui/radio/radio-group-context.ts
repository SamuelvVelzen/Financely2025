import React from "react";

export type IRadioGroupContext = {
  name: string;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  groupId: string;
  registerItem: (value: string, element: HTMLButtonElement | null) => void;
  getItems: () => string[];
  getItemElement: (value: string) => HTMLButtonElement | undefined;
  focusItem: (value: string) => void;
};

export const RadioGroupContext = React.createContext<IRadioGroupContext | null>(
  null
);
