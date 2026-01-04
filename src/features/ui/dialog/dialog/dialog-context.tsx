import { createContext, useContext } from "react";

interface IDialogContext {
  zIndex: number;
}

export const DialogContext = createContext<IDialogContext | null>(null);

export function useDialogContext() {
  return useContext(DialogContext);
}
