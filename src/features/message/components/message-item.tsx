"use client";

import type { IMessage } from "@/features/shared/validation/schemas";
import { Badge } from "@/features/ui/badge/badge";
import { IconButton } from "@/features/ui/button/icon-button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { useToast } from "@/features/ui/toast";
import { cn } from "@/features/util/cn";
import { useState } from "react";
import { HiTrash } from "react-icons/hi2";
import { useDeleteMessage } from "../hooks/useMessages";
import { MessageActions } from "./message-actions";

type IMessageItemProps = {
  message: IMessage;
};

export function MessageItem({ message }: IMessageItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteMessage = useDeleteMessage();
  const toast = useToast();

  const typeStyles = {
    INFO: "border-l-4 border-info bg-info-bg/50",
    SUCCESS: "border-l-4 border-success bg-success-bg/50",
    WARNING: "border-l-4 border-warning bg-warning-bg/50",
    ERROR: "border-l-4 border-danger bg-danger-bg/50",
  };

  const typeBadgeColors = {
    INFO: "#2563eb",
    SUCCESS: "#16a34a",
    WARNING: "#d97706",
    ERROR: "#dc2626",
  };

  const handleDeleteConfirm = () => {
    deleteMessage.mutate(message.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        toast.success("Message deleted successfully");
      },
      onError: () => {
        toast.error("Failed to delete message");
      },
    });
  };

  return (
    <>
      <div
        className={cn(
          "p-4 rounded-2xl border",
          typeStyles[message.type],
          !message.read && "font-semibold"
        )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-semibold text-text">
                {message.title}
              </h3>
              <Badge backgroundColor={typeBadgeColors[message.type]}>
                {message.type}
              </Badge>
              {!message.read && <Badge backgroundColor="#2563eb">New</Badge>}
            </div>
            <p className="text-sm text-text-muted whitespace-pre-wrap">
              {message.content}
            </p>
            <MessageActions
              actions={message.actions}
              messageId={message.id}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-text-muted">
              {new Date(message.createdAt).toLocaleDateString()}
            </div>
            <IconButton
              variant="danger"
              size="sm"
              clicked={() => setIsDeleteDialogOpen(true)}
              aria-label="Delete message">
              <HiTrash className="size-4" />
            </IconButton>
          </div>
        </div>
      </div>

      <DeleteDialog
        title="Delete Message"
        content={
          <p className="text-text-muted">
            Are you sure you want to delete this message? This action cannot be
            undone.
          </p>
        }
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        footerButtons={[
          {
            clicked: () => setIsDeleteDialogOpen(false),
            buttonContent: "Cancel",
          },
          {
            clicked: handleDeleteConfirm,
            variant: "danger",
            loading: {
              isLoading: deleteMessage.isPending,
              text: "Deleting message",
            },
            buttonContent: "Delete",
            disabled: deleteMessage.isPending,
          },
        ]}
      />
    </>
  );
}
