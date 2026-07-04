import { useCallback, useState } from "react";

export function useAddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const openDialog = useCallback(() => setOpen(true), []);

  return {
    open,
    onOpenChange: setOpen,
    openDialog,
  };
}
