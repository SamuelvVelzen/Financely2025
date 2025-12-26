"use client";

import { MessageList } from "@/features/message/components/message-list";
import {
  useMarkAllAsRead,
  useMessages,
} from "@/features/message/hooks/useMessages";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/(app)/messages")({
  component: MessagesPage,
  head: () => ({
    meta: [
      {
        title: "Messages | Financely",
      },
    ],
  }),
});

function MessagesPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<
    "INFO" | "SUCCESS" | "WARNING" | "ERROR" | undefined
  >(undefined);
  const toast = useToast();
  const markAllAsRead = useMarkAllAsRead();

  const { data, isLoading } = useMessages({
    read: filter === "unread" ? false : undefined,
    type: typeFilter,
    page: 1,
    limit: 50,
  });

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast.success("All messages marked as read");
    } catch (error) {
      toast.error("Failed to mark all messages as read");
    }
  };

  return (
    <>
      <Container className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <Title>Messages</Title>
            <p className="text-text-muted">View and manage your messages.</p>
          </div>
          {data && data.data.length > 0 && (
            <Button
              size="sm"
              clicked={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              loading={{
                isLoading: markAllAsRead.isPending,
                text: "Marking all messages as read",
              }}
              buttonContent="Mark All as Read"
            />
          )}
        </div>
      </Container>

      <Container className="mb-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "primary" : "default"}
            size="sm"
            clicked={() => setFilter("all")}
            buttonContent="All"
          />
          <Button
            variant={filter === "unread" ? "primary" : "default"}
            size="sm"
            clicked={() => setFilter("unread")}
            buttonContent="Unread"
          />
          <Button
            variant={typeFilter === undefined ? "primary" : "default"}
            size="sm"
            clicked={() => setTypeFilter(undefined)}
            buttonContent="All Types"
          />
          <Button
            variant={typeFilter === "INFO" ? "primary" : "default"}
            size="sm"
            clicked={() => setTypeFilter("INFO")}
            buttonContent="Info"
          />
          <Button
            variant={typeFilter === "SUCCESS" ? "primary" : "default"}
            size="sm"
            clicked={() => setTypeFilter("SUCCESS")}
            buttonContent="Success"
          />
          <Button
            variant={typeFilter === "WARNING" ? "primary" : "default"}
            size="sm"
            clicked={() => setTypeFilter("WARNING")}
            buttonContent="Warning"
          />
          <Button
            variant={typeFilter === "ERROR" ? "primary" : "default"}
            size="sm"
            clicked={() => setTypeFilter("ERROR")}
            buttonContent="Error"
          />
        </div>
      </Container>

      <Container>
        <MessageList
          messages={data?.data || []}
          isLoading={isLoading}
        />
        <MessageList
          messages={data?.data || []}
          isLoading={isLoading}
        />
      </Container>
    </>
  );
}
