import { AddOrCreateTagDialog } from "@/features/tag/components/add-or-create-tag-dialog";
import { TagList } from "@/features/tag/components/tag-list";
import {
  RECOMMENDED_TAGS,
  type IRecommendedTag,
} from "@/features/tag/config/recommended-tags";
import { useCreateTag, useDeleteTag, useTags } from "@/features/tag/hooks/useTags";
import { Button } from "@/features/ui/button/button";
import { Spinner } from "@/features/ui/loading/spinner";
import { useToast } from "@/features/ui/toast";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import { useMemo, useState } from "react";
import { HiCheck, HiPlus } from "react-icons/hi";
import { HiOutlineTag } from "react-icons/hi2";

export function TagsSetup() {
  const { data: tagsResponse, isLoading } = useTags();
  const { mutate: createTag, isPending: isCreating } = useCreateTag();
  const { mutate: deleteTag, isPending: isDeleting } = useDeleteTag();
  const toast = useToast();
  const [addingTagName, setAddingTagName] = useState<string | null>(null);
  const [removingTagId, setRemovingTagId] = useState<string | null>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);

  const existingTags = tagsResponse?.data ?? [];
  // Create a set of existing tags with both name and transaction type as the key
  // This matches the filtering logic in tag-overview.tsx
  const existingTagsSet = new Set(
    existingTags.map(
      (tag) => `${tag.name.toLowerCase().trim()}:${tag.transactionType}`
    )
  );
  // Create a map of tag name (lowercase) to tag ID for quick lookup
  const tagNameToIdMap = new Map(
    existingTags.map((t) => [t.name.toLowerCase(), t.id])
  );

  const handleToggleRecommendedTag = (tag: IRecommendedTag) => {
    // Since we filter out added tags, this should only create
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
        onSuccess: () => {
          toast.success(`Tag "${tag.name}" added`);
        },
        onSettled: () => {
          setAddingTagName(null);
        },
      }
    );
  };

  // Separate existing tags by transaction type
  const expenseTagsCreated = useMemo(
    () => existingTags.filter((tag) => tag.transactionType === "EXPENSE"),
    [existingTags]
  );
  const incomeTagsCreated = useMemo(
    () => existingTags.filter((tag) => tag.transactionType === "INCOME"),
    [existingTags]
  );

  // Filter out already-added tags from recommended
  // Filter by both name AND transaction type (matching tag-overview.tsx logic)
  const expenseTags = useMemo(
    () =>
      RECOMMENDED_TAGS.filter(
        (t) =>
          t.transactionType === "EXPENSE" &&
          !existingTagsSet.has(
            `${t.name.toLowerCase().trim()}:${t.transactionType}`
          )
      ),
    [existingTagsSet]
  );
  const incomeTags = useMemo(
    () =>
      RECOMMENDED_TAGS.filter(
        (t) =>
          t.transactionType === "INCOME" &&
          !existingTagsSet.has(
            `${t.name.toLowerCase().trim()}:${t.transactionType}`
          )
      ),
    [existingTagsSet]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleDeleteTag = (tagId: string) => {
    const tag = existingTags.find((t) => t.id === tagId);
    if (!tag) return;

    setRemovingTagId(tagId);

    deleteTag(tagId, {
      onSettled: () => {
        setRemovingTagId(null);
      },
    });
  };

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <HiOutlineTag className="size-8 text-primary" />
        </div>
        <Title className="text-2xl mb-2">Set Up Your Tags</Title>
        <Text
          isMuted
          className="max-w-md mx-auto">
          Tags help you categorize your transactions. Select the ones that match
          your spending habits, or create your own.
        </Text>
      </div>

      {/* Active Tags List */}
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
                  onDelete={handleDeleteTag}
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
                  onDelete={handleDeleteTag}
                  draggable={false}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommended Tags Section */}
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

          {/* Expense Tags */}
          {expenseTags.length > 0 && (
            <div className="mb-6 pb-6 border-b border-danger/20 last:mb-0 last:pb-0 last:border-b-0">
              <Text className="font-medium mb-3 flex items-center gap-2 text-sm text-text-muted">
                <span className="text-danger text-base">●</span> Expense Tags
              </Text>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {expenseTags.map((tag) => {
                  const isAdding = addingTagName === tag.name;
                  const isProcessing = isAdding;

                  return (
                    <button
                      key={tag.name}
                      onClick={() => !isProcessing && handleToggleRecommendedTag(tag)}
                      disabled={isProcessing}
                      title="Add tag"
                      className={`
                        group flex items-center gap-2 p-3 rounded-xl border transition-all text-left
                        ${isProcessing
                          ? "bg-surface/50 border-border/50 cursor-wait opacity-70"
                          : "bg-surface/50 border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                        }
                      `}>
                      {tag.emoticon && <span className="text-lg">{tag.emoticon}</span>}
                      <span className="flex-1 text-sm font-medium">{tag.name}</span>
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

          {/* Income Tags */}
          {incomeTags.length > 0 && (
            <div className="mb-6 pb-6 border-b border-success/20 last:mb-0 last:pb-0 last:border-b-0">
              <Text className="font-medium mb-3 flex items-center gap-2 text-sm text-text-muted">
                <span className="text-success text-base">●</span> Income Tags
              </Text>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {incomeTags.map((tag) => {
                  const isAdding = addingTagName === tag.name;
                  const isProcessing = isAdding;

                  return (
                    <button
                      key={tag.name}
                      onClick={() => !isProcessing && handleToggleRecommendedTag(tag)}
                      disabled={isProcessing}
                      title="Add tag"
                      className={`
                        group flex items-center gap-2 p-3 rounded-xl border transition-all text-left
                        ${isProcessing
                          ? "bg-surface/50 border-border/50 cursor-wait opacity-70"
                          : "bg-surface/50 border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                        }
                      `}>
                      {tag.emoticon && <span className="text-lg">{tag.emoticon}</span>}
                      <span className="flex-1 text-sm font-medium">{tag.name}</span>
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

      {/* Empty state when no recommended tags available */}
      {expenseTags.length === 0 && incomeTags.length === 0 && existingTags.length > 0 && (
        <div className="mb-8 p-6 bg-surface/30 border border-border/50 rounded-2xl text-center">
          <Text isMuted size="sm">
            All recommended tags have been added. Create custom tags to add more categories.
          </Text>
        </div>
      )}

      {/* Custom tag button */}
      <div className="text-center pt-4 border-t border-border">
        <Button
          clicked={() => setShowCustomDialog(true)}
          variant="default"
          size="md"
          className="gap-2">
          <HiPlus className="size-4" />
          Create Custom Tag
        </Button>
      </div>

      <AddOrCreateTagDialog
        open={showCustomDialog}
        onOpenChange={setShowCustomDialog}
      />
    </>
  );
}
