import type {
  CreateTagFieldsSchema,
  ITag,
  ITransactionType,
} from "@/features/shared/validation/schemas";
import type { z } from "zod";

export type IAddOrEditTagDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: ITag;
  initialName?: string;
  initialValues?: Partial<IAddOrEditTagFormData>;
  showTagRules?: boolean;
  onSuccess?: (createdTag?: ITag) => void;
};

export type IAddOrEditTagFormData = z.infer<typeof CreateTagFieldsSchema>;

export const getEmptyTagFormValues = (): IAddOrEditTagFormData => ({
  name: "",
  color: "",
  description: "",
  emoticon: "",
  transactionType: "EXPENSE" as ITransactionType,
});

export function buildTagSubmitData(data: IAddOrEditTagFormData) {
  const transactionType =
    data.transactionType &&
      (data.transactionType === "EXPENSE" || data.transactionType === "INCOME")
      ? data.transactionType
      : "EXPENSE";

  return {
    name: data.name,
    color:
      data.color &&
        data.color.trim() !== "" &&
        /^#[0-9A-Fa-f]{6}$/.test(data.color.trim())
        ? data.color.trim()
        : null,
    description:
      data.description && data.description.trim() !== ""
        ? data.description.trim()
        : null,
    emoticon:
      data.emoticon && data.emoticon.trim() !== ""
        ? data.emoticon.trim()
        : null,
    transactionType: transactionType as ITransactionType,
  };
}
