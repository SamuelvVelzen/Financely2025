import React from "react";

export type IRadioGroupContext = {
  name: string;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  groupId: string;
};

export const RadioGroupContext = React.createContext<IRadioGroupContext | null>(
  null
);
