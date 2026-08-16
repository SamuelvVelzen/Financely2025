import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type { ITag } from "@/features/shared/validation/schemas";
import { AddOrEditTagDialog } from "@/features/tag/components/add-or-edit-tag-dialog";
import { TagList } from "@/features/tag/components/tag-list";
import {
  RECOMMENDED_TAGS,
  type IRecommendedTag,
} from "@/features/tag/config/recommended-tags";
import { useCreateTag, useDeleteTag, useTags } from "@/features/tag/hooks/useTags";
import { Button } from "@/features/ui/button/button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Spinner } from "@/features/ui/loading/spinner";
import { useToast } from "@/features/ui/toast";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import { useMemo, useState } from "react";
import { HiCheck, HiOutlineTag, HiPlus } from "react-icons/hi2";

export function TagsSetup() {
  const { data: tagsResponse, isLoading } = useTags();
  const { mutate: createTag } = useCreateTag();
  const { mutate: deleteTag } = useDeleteTag();
  const toast = useToast();
  const [addingTagName, setAddingTagName] = useState<string | null>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ITag | undefined>(undefined);

  const existingTags = useMemo(
    () => tagsResponse?.data ?? [],
    [tagsResponse?.data],
  );
  const existingTagsSet = useMemo(
    () =>
      new Set(
        existingTags.map(
          (tag) => `${tag.name.toLowerCase().trim()}:${tag.transactionType}`,
        ),
      ),
    [existingTags],
  );

  const handleToggleRecommendedTag = (tag: IRecommendedTag) => {
    setAddingTagName(tag.name);
    createTag(
      {
        name: tag.name,
        transactionType: tag.transactionType,
        emoticon: tag.emoticon ?? null,
        color: tag.color ?? null,
        description: tag.description ?? null,
      },
      {
        onSuccess: (data) => {
          if (!isOfflineMutationPlaceholder(data)) {
            toast.success(`Tag "${tag.name}" added`);
          }
        },
        onSettled: () => {
          setAddingTagName(null);
        },
      },
    );
  };

  const expenseTagsCreated = useMemo(
    () => existingTags.filter((tag) => tag.transactionType === "EXPENSE"),
    [existingTags],
  );
  const incomeTagsCreated = useMemo(
    () => existingTags.filter((tag) => tag.transactionType === "INCOME"),
    [existingTags],
  );

  const expenseTags = useMemo(
    () =>
      RECOMMENDED_TAGS.filter(
        (t) =>
          t.transactionType === "EXPENSE" &&
          !existingTagsSet.has(
            `${t.name.toLowerCase().trim()}:${t.transactionType}`,
          ),
      ),
    [existingTagsSet],
  );
  const incomeTags = useMemo(
    () =>
      RECOMMENDED_TAGS.filter(
        (t) =>
          t.transactionType === "INCOME" &&
          !existingTagsSet.has(
            `${t.name.toLowerCase().trim()}:${t.transactionType}`,
          ),
      ),
    [existingTagsSet],
  );

  const handleDeleteClick = (tagId: string) => {
    setSelectedTag(existingTags.find((tag) => tag.id === tagId));
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedTag) return;

    deleteTag(selectedTag.id, {
      onSuccess: (data) => {
        setIsDeleteDialogOpen(false);
        setSelectedTag(undefined);
        if (!isOfflineMutationPlaceholder(data)) {
          toast.success("Tag deleted successfully");
        }
      },
      onError: () => {
        toast.error("Failed to delete tag");
      },
    });
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTag(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex flex-col items-center sm:items-start">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <HiOutlineTag className="size-8 text-primary" />
            </div>
            <Title className="text-2xl mb-2">Set Up Your Tags</Title>
            <Text
              isMuted
              className="max-w-md">
              Tags help you categorize your transactions. Select the ones that
              match your spending habits, or create your own.
            </Text>
          </div>
          <Button
            clicked={() => setShowCustomDialog(true)}
            variant="primary"
            size="md"
            className="gap-2 shrink-0">
            <HiPlus className="size-4" />
            Create Custom Tag
          </Button>
        </div>
      </div>

      {existingTags.length > 0 && (
        <div className="mb-8">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Text className="font-semibold flex items-center gap-2 text-text">
                <HiCheck className="size-5 text-success" />
                Active Tags ({existingTags.length})
              </Text>
              <Button
                clicked={() => setShowCustomDialog(true)}
                variant="default"
                size="sm"
                className="gap-2">
                <HiPlus className="size-4" />
                Custom
              </Button>
            </div>

            {expenseTagsCreated.length > 0 && (
              <div className="mb-6 pb-6 border-b border-border/50 last:mb-0 last:pb-0 last:border-b-0">
                <Text className="font-semibold mb-3 flex items-center gap-2 text-sm text-text">
                  <span className="text-danger text-base">●</span> Expense Tags
                </Text>
                <TagList
                  data={expenseTagsCreated}
                  onDelete={handleDeleteClick}
                  draggable={false}
                />
              </div>
            )}

            {incomeTagsCreated.length > 0 && (
              <div className="mb-6 pb-6 border-b border-border/50 last:mb-0 last:pb-0 last:border-b-0">
                <Text className="font-semibold mb-3 flex items-center gap-2 text-sm text-text">
                  <span className="text-success text-base">●</span> Income Tags
                </Text>
                <TagList
                  data={incomeTagsCreated}
                  onDelete={handleDeleteClick}
                  draggable={false}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {(expenseTags.length > 0 || incomeTags.length > 0) && (
        <div className="mb-8">
          <div className="mb-4">
            <Text className="font-semibold mb-2 text-text">Recommended Tags</Text>
            <Text
              isMuted
              size="sm"
              className="text-text-muted">
              Tap to add common categories — you can change these later.
            </Text>
          </div>

          {expenseTags.length > 0 && (
            <div className="mb-6 pb-6 border-b border-danger/20 last:mb-0 last:pb-0 last:border-b-0">
              <Text className="font-medium mb-3 flex items-center gap-2 text-sm text-text-muted">
                <span className="text-danger text-base">●</span> Expense Tags
              </Text>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {expenseTags.map((tag) => {
                  const isProcessing = addingTagName === tag.name;

                  return (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() =>
                        !isProcessing && handleToggleRecommendedTag(tag)
                      }
                      disabled={isProcessing}
                      title="Add tag"
                      className={`
                        group flex items-center gap-2 p-3 rounded-xl border transition-all text-left
                        ${
                          isProcessing
                            ? "bg-surface/50 border-border/50 cursor-wait opacity-70"
                            : "bg-surface/50 border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                        }
                      `}>
                      {tag.emoticon && (
                        <span className="text-lg">{tag.emoticon}</span>
                      )}
                      <span className="flex-1 text-sm font-medium">
                        {tag.name}
                      </span>
                      {isProcessing ? (
                        <Spinner size="sm" />
                      ) : (
                        <HiPlus className="size-4 text-text-muted group-hover:text-primary transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {incomeTags.length > 0 && (
            <div className="mb-6 pb-6 border-b border-success/20 last:mb-0 last:pb-0 last:border-b-0">
              <Text className="font-medium mb-3 flex items-center gap-2 text-sm text-text-muted">
                <span className="text-success text-base">●</span> Income Tags
              </Text>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {incomeTags.map((tag) => {
                  const isProcessing = addingTagName === tag.name;

                  return (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() =>
                        !isProcessing && handleToggleRecommendedTag(tag)
                      }
                      disabled={isProcessing}
                      title="Add tag"
                      className={`
                        group flex items-center gap-2 p-3 rounded-xl border transition-all text-left
                        ${
                          isProcessing
                            ? "bg-surface/50 border-border/50 cursor-wait opacity-70"
                            : "bg-surface/50 border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                        }
                      `}>
                      {tag.emoticon && (
                        <span className="text-lg">{tag.emoticon}</span>
                      )}
                      <span className="flex-1 text-sm font-medium">
                        {tag.name}
                      </span>
                      {isProcessing ? (
                        <Spinner size="sm" />
                      ) : (
                        <HiPlus className="size-4 text-text-muted group-hover:text-primary transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {expenseTags.length === 0 &&
        incomeTags.length === 0 &&
        existingTags.length > 0 && (
          <div className="mb-8 p-6 bg-surface/30 border border-border/50 rounded-2xl text-center">
            <Text
              isMuted
              size="sm">
              All recommended tags have been added. Use Create Custom Tag to add
              more categories.
            </Text>
          </div>
        )}

      <AddOrEditTagDialog
        open={showCustomDialog}
        onOpenChange={setShowCustomDialog}
      />

      <DeleteDialog
        title="Delete Tag"
        content={`Are you sure you want to delete the tag "${selectedTag?.name}"? This action cannot be undone.`}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: handleDeleteCancel,
          },
          {
            buttonContent: "Delete",
            clicked: handleDeleteConfirm,
            variant: "danger",
          },
        ]}
      />
    </>
  );
}
