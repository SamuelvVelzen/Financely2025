export type ISplitGroupDialogTarget = {
  id: string;
  name: string;
  defaultCurrency: string;
  expenseCount: number;
};

export type IAddOrEditSplitGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: ISplitGroupDialogTarget;
  defaultCurrency: string;
  onSuccess?: () => void;
};

export type ISplitGroupFormValues = {
  name: string;
  defaultCurrency: string;
};

export function getEmptySplitGroupFormValues(
  defaultCurrency: string,
): ISplitGroupFormValues {
  return {
    name: "",
    defaultCurrency,
  };
}

export function getSplitGroupFormValuesFromGroup(
  group: ISplitGroupDialogTarget,
): ISplitGroupFormValues {
  return {
    name: group.name,
    defaultCurrency: group.defaultCurrency,
  };
}
