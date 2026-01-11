import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import { useScrollPosition } from "@/features/shared/hooks/use-scroll-position";
import type {
  ICreateTagInput,
  ITag,
} from "@/features/shared/validation/schemas";
import { RECOMMENDED_TAGS } from "@/features/tag/config/recommended-tags";
import {
  useCreateTag,
  useDeleteTag,
  useReorderTags,
  useTags,
} from "@/features/tag/hooks/useTags";
import { Container } from "@/features/ui/container/container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Loading } from "@/features/ui/loading/loading";
import { Tab } from "@/features/ui/tab/tab";
import { TabContent } from "@/features/ui/tab/tab-content";
import { Tabs } from "@/features/ui/tab/tabs";
import { useToast } from "@/features/ui/toast";
import { useDebouncedValue } from "@/features/util/use-debounced-value";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineTag } from "react-icons/hi2";
import { AddOrCreateTagDialog } from "./add-or-create-tag-dialog";
import { TagCsvImportDialog } from "./tag-csv-import-dialog";
import { TagList } from "./tag-list";
import { TagOverviewHeader } from "./tag-overview-header";

interface ITagOverviewProps {
  initialSearchQuery?: string;
}

export function TagOverview({ initialSearchQuery = "" }: ITagOverviewProps) {
  const navigate = useNavigate();
  const expandedHeaderRef = useRef<HTMLDivElement>(null);
  const [isSticky, setExpandedHeaderElement] = useScrollPosition();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  // Set up scroll detection for expanded header
  useEffect(() => {
    if (expandedHeaderRef.current) {
      setExpandedHeaderElement(expandedHeaderRef.current);
    }
  }, [setExpandedHeaderElement]);

  // Update search query when initialSearchQuery changes (e.g., from URL navigation)
  useEffect(() => {
    if (searchQuery !== initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Sync search query changes to query params
  useEffect(() => {
    const trimmedQuery = debouncedSearchQuery.trim();
    navigate({
      to: "/tags",
      search: trimmedQuery ? { q: trimmedQuery } : {},
      replace: true, // Use replace to avoid cluttering browser history
    });
  }, [debouncedSearchQuery, navigate]);

  // Build query with search filter (backend filtering)
  const query = useMemo(() => {
    return {
      q: debouncedSearchQuery.trim() || undefined,
      sort: "name:asc" as const,
    };
  }, [debouncedSearchQuery]);

  const { data, isLoading, error } = useTags(query);
  const tags = data?.data ?? [];
  const sortedTags = useOrderedData(tags) as ITag[];
  const { mutate: createTag } = useCreateTag();
  const { mutate: deleteTag } = useDeleteTag();
  const { mutate: reorderTags } = useReorderTags();
  const toast = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ITag | undefined>(undefined);

  // Separate tags into two sections
  const expenseTags = useMemo(
    () => sortedTags.filter((tag) => tag.transactionType === "EXPENSE"),
    [sortedTags]
  );
  const incomeTags = useMemo(
    () => sortedTags.filter((tag) => tag.transactionType === "INCOME"),
    [sortedTags]
  );

  // Helper function to handle reordering within a section
  // Merges the reordered section tags back into the global order
  const handleSectionReorder = (sectionTagIds: string[], allTags: ITag[]) => {
    // Create a map of all tags by ID
    const tagMap = new Map(allTags.map((tag) => [tag.id, tag]));

    // Create ordered list starting with section tags
    const reorderedIds: string[] = [];

    // First, add all section tags in their new order
    sectionTagIds.forEach((tagId) => {
      if (tagMap.has(tagId)) {
        reorderedIds.push(tagId);
      }
    });

    // Then, add remaining tags (from other sections) maintaining their relative order
    allTags.forEach((tag) => {
      if (!sectionTagIds.includes(tag.id)) {
        reorderedIds.push(tag.id);
      }
    });

    // Reorder all tags based on the merged order
    reorderTags(
      { tagIds: reorderedIds },
      {
        onError: (error: Error) => {
          console.error("Failed to reorder tags:", error);
          // Error is already handled by the hook (rollback)
        },
      }
    );
  };

  // Calculate filter count
  const filterCount = useMemo(() => {
    return searchQuery.trim().length > 0 ? 1 : 0;
  }, [searchQuery]);

  const handleStickyFiltersClick = () => {
    // Scroll to top to show the search input
    expandedHeaderRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCreateTag = () => {
    setSelectedTag(undefined);
    setIsTagDialogOpen(true);
  };

  const handleEditTag = (tag: ITag) => {
    setSelectedTag(tag);
    setIsTagDialogOpen(true);
  };

  const handleDeleteClick = (tagId: string) => {
    setSelectedTag(tags.find((tag: ITag) => tag.id === tagId));
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTag) {
      deleteTag(selectedTag.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedTag(undefined);
          toast.success("Tag deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete tag");
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTag(undefined);
  };

  const [recommendedTagData, setRecommendedTagData] = useState<
    (typeof RECOMMENDED_TAGS)[0] | undefined
  >(undefined);

  // Filter recommended tags by transaction type and exclude existing tags (by name and type)
  const filteredRecommendedTags = useMemo(() => {
    // Create a set of existing tags with both name and transaction type as the key
    const existingTags = new Set(
      tags.map(
        (tag) => `${tag.name.toLowerCase().trim()}:${tag.transactionType}`
      )
    );
    return RECOMMENDED_TAGS.filter(
      (recommendedTag) =>
        !existingTags.has(
          `${recommendedTag.name.toLowerCase().trim()}:${recommendedTag.transactionType}`
        )
    );
  }, [tags]);

  const expenseRecommendedTags = useMemo(
    () =>
      filteredRecommendedTags.filter(
        (tag) => tag.transactionType === "EXPENSE"
      ),
    [filteredRecommendedTags]
  );

  const incomeRecommendedTags = useMemo(
    () =>
      filteredRecommendedTags.filter((tag) => tag.transactionType === "INCOME"),
    [filteredRecommendedTags]
  );

  const handleCreateFromRecommended = (
    recommendedTag: (typeof RECOMMENDED_TAGS)[0]
  ) => {
    // Transform recommended tag data to match ICreateTagInput
    // Ensure empty strings are converted to null for optional fields
    // The schema expects null (not undefined) for nullable optional fields
    const tagInput: ICreateTagInput = {
      name: recommendedTag.name,
      color:
        recommendedTag.color && recommendedTag.color.trim() !== ""
          ? recommendedTag.color.trim()
          : null,
      description:
        recommendedTag.description && recommendedTag.description.trim() !== ""
          ? recommendedTag.description.trim()
          : null,
      emoticon:
        recommendedTag.emoticon && recommendedTag.emoticon.trim() !== ""
          ? recommendedTag.emoticon.trim()
          : null,
      transactionType: recommendedTag.transactionType,
    };

    createTag(tagInput, {
      onSuccess: () => {
        toast.success(`Tag "${recommendedTag.name}" created successfully`);
      },
      onError: () => {
        toast.error(`Failed to create tag "${recommendedTag.name}"`);
      },
    });
  };

  const actions = useMemo(
    () => ({
      onCreateTag: handleCreateTag,
      onCsvImportClick: () => setIsCsvImportDialogOpen(true),
    }),
    [handleCreateTag]
  );

  return (
    <>
      {/* Sentinel element - used to detect when header should become sticky */}
      <div ref={expandedHeaderRef} className="h-0" />

      <TagOverviewHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        actions={actions}
        isSticky={isSticky}
        filterCount={filterCount}
        onFiltersClick={handleStickyFiltersClick}
      />

      {isLoading && (
        <Container>
          <Loading text="Loading tags" />
        </Container>
      )}

      {error && (
        <Container>
          <p className="text-red-500 text-center">
            Error loading tags: {error.message}
          </p>
        </Container>
      )}

      {!isLoading && !error && (
        <>
          {sortedTags.length === 0 &&
            expenseRecommendedTags.length === 0 &&
            incomeRecommendedTags.length === 0 && (
              <Container>
                <div className="text-center py-8">
                  <HiOutlineTag className="size-12 mx-auto text-text-muted mb-4" />
                  <h2 className="text-xl font-semibold text-text mb-2">
                    No tags yet
                  </h2>
                  <p className="text-text-muted mb-6">
                    Get started by creating your first tag or choose from our
                    recommended tags below.
                  </p>
                </div>
              </Container>
            )}

          {(sortedTags.length > 0 ||
            expenseRecommendedTags.length > 0 ||
            incomeRecommendedTags.length > 0) && (
            <Container>
              <Tabs defaultValue="expense">
                <Tab value="expense">Expense</Tab>
                <Tab value="income">Income</Tab>

                <TabContent value="expense">
                  <div className="space-y-6">
                    {expenseTags.length > 0 ? (
                      <div>
                        <h2 className="text-lg font-semibold mb-4 text-text">
                          Expense Tags
                        </h2>
                        <TagList
                          data={expenseTags}
                          searchQuery={debouncedSearchQuery}
                          onEdit={handleEditTag}
                          onDelete={handleDeleteClick}
                          onOrderChange={(orderedIds) => {
                            handleSectionReorder(
                              orderedIds as string[],
                              sortedTags
                            );
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <HiOutlineTag className="size-12 mx-auto text-text-muted mb-4" />
                        <p className="text-text-muted">
                          No expense tags yet. Create one or choose from
                          recommended tags below.
                        </p>
                      </div>
                    )}

                    {expenseRecommendedTags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-text">
                          Recommended Tags
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {expenseRecommendedTags.map(
                            (recommendedTag, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() =>
                                  handleCreateFromRecommended(recommendedTag)
                                }
                                className="p-4 border border-border rounded-lg hover:bg-surface-hover transition-colors text-left group">
                                <div className="flex items-center gap-3">
                                  {recommendedTag.emoticon && (
                                    <span className="text-2xl">
                                      {recommendedTag.emoticon}
                                    </span>
                                  )}
                                  {recommendedTag.color && (
                                    <div
                                      className="size-4 rounded shrink-0"
                                      style={{
                                        backgroundColor: recommendedTag.color,
                                      }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-text group-hover:text-primary">
                                      {recommendedTag.name}
                                    </div>
                                    {recommendedTag.description && (
                                      <div className="text-sm text-text-muted mt-1">
                                        {recommendedTag.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabContent>

                <TabContent value="income">
                  <div className="space-y-6">
                    {incomeTags.length > 0 ? (
                      <div>
                        <h2 className="text-lg font-semibold mb-4 text-text">
                          Income Tags
                        </h2>
                        <TagList
                          data={incomeTags}
                          searchQuery={debouncedSearchQuery}
                          onEdit={handleEditTag}
                          onDelete={handleDeleteClick}
                          onOrderChange={(orderedIds) => {
                            handleSectionReorder(
                              orderedIds as string[],
                              sortedTags
                            );
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <HiOutlineTag className="size-12 mx-auto text-text-muted mb-4" />
                        <p className="text-text-muted">
                          No income tags yet. Create one or choose from
                          recommended tags below.
                        </p>
                      </div>
                    )}

                    {incomeRecommendedTags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-text">
                          Recommended Tags
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {incomeRecommendedTags.map(
                            (recommendedTag, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() =>
                                  handleCreateFromRecommended(recommendedTag)
                                }
                                className="p-4 border border-border rounded-lg hover:bg-surface-hover transition-colors text-left group">
                                <div className="flex items-center gap-3">
                                  {recommendedTag.emoticon && (
                                    <span className="text-2xl">
                                      {recommendedTag.emoticon}
                                    </span>
                                  )}
                                  {recommendedTag.color && (
                                    <div
                                      className="size-4 rounded shrink-0"
                                      style={{
                                        backgroundColor: recommendedTag.color,
                                      }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-text group-hover:text-primary">
                                      {recommendedTag.name}
                                    </div>
                                    {recommendedTag.description && (
                                      <div className="text-sm text-text-muted mt-1">
                                        {recommendedTag.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabContent>
              </Tabs>
            </Container>
          )}
        </>
      )}

      <AddOrCreateTagDialog
        open={isTagDialogOpen}
        onOpenChange={(open) => {
          setIsTagDialogOpen(open);
          if (!open) {
            setRecommendedTagData(undefined);
          }
        }}
        tag={selectedTag}
        initialValues={
          recommendedTagData
            ? {
                name: recommendedTagData.name,
                color: recommendedTagData.color ?? "",
                description: recommendedTagData.description ?? "",
                emoticon: recommendedTagData.emoticon ?? "",
                transactionType: recommendedTagData.transactionType,
              }
            : undefined
        }
        onSuccess={() => {
          setRecommendedTagData(undefined);
        }}
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

      <TagCsvImportDialog
        open={isCsvImportDialogOpen}
        onOpenChange={setIsCsvImportDialogOpen}
        onSuccess={() => {
          // Tags will be refetched automatically via query invalidation
        }}
      />
    </>
  );
}
