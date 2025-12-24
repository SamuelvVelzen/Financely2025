"use client";

import type { IMessage } from "@/features/shared/validation/schemas";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { SkeletonText } from "@/features/ui/skeleton";
import { MessageItem } from "./message-item";

type IMessageListProps = {
  messages: IMessage[];
  isLoading?: boolean;
};

export function MessageList({ messages, isLoading }: IMessageListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-lg border">
            <SkeletonText lines={3} />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return <EmptyPage emptyText="No messages yet." />;
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
        />
      ))}
    </div>
  );
}
