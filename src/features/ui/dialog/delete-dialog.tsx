import { Dialog } from "./dialog/dialog";
import { IDialogProps } from "./dialog/types";

type IDeleteDialogProps = {
  content: IDialogProps["content"];
  title: IDialogProps["title"];
  footerButtons: IDialogProps["footerButtons"];

  open: IDialogProps["open"];
  onOpenChange: IDialogProps["onOpenChange"];
};

export function DeleteDialog({
  title,
  content,
  footerButtons,
  open,
  onOpenChange,
}: IDeleteDialogProps) {
  return (
    <Dialog
      title={title}
      status="danger"
      content={content}
      open={open}
      onOpenChange={onOpenChange}
      footerButtons={footerButtons}
    />
  );
}
