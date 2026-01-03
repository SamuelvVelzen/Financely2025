import {
  BulkCreateTagInputSchema,
  CreateTagInputSchema,
  ReorderTagsInputSchema,
  TagSchema,
  TagsQuerySchema,
  UpdateTagInputSchema,
  type IBulkCreateTagInput,
  type IBulkCreateTagResponse,
  type ICreateTagInput,
  type IReorderTagsInput,
  type ITag,
  type ITagsQuery,
  type IUpdateTagInput,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";

/**
 * Tag Service
 * Handles tag-related business logic and data access
 */
export class TagService {
  /**
   * List tags for a user with optional filtering and sorting
   */
  static async listTags(
    userId: string,
    query: ITagsQuery
  ): Promise<{ data: ITag[] }> {
    const validated = TagsQuerySchema.parse(query);

    const tags = await prisma.tag.findMany({
      where: {
        userId,
        ...(validated.q && {
          OR: [
            {
              name: {
                contains: validated.q,
              },
            },
            {
              description: {
                contains: validated.q,
              },
            },
            {
              color: {
                contains: validated.q,
              },
            },
          ],
        }),
      },
      orderBy: [
        {
          order: "asc",
        },
      ],
    });

    return {
      data: tags.map(
        (tag: {
          id: string;
          name: string;
          color: string | null;
          description: string | null;
          order: number;
          transactionType: "EXPENSE" | "INCOME" | null | undefined;
          createdAt: Date;
          updatedAt: Date;
        }) =>
          TagSchema.parse({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            description: tag.description,
            order: tag.order,
            transactionType: tag.transactionType ?? null,
            createdAt: tag.createdAt.toISOString(),
            updatedAt: tag.updatedAt.toISOString(),
          })
      ),
    };
  }

  /**
   * Get tag by ID (user-scoped)
   */
  static async getTagById(userId: string, tagId: string): Promise<ITag | null> {
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId,
      },
    });

    if (!tag) {
      return null;
    }

    return TagSchema.parse({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      order: tag.order,
      transactionType: tag.transactionType ?? null,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    });
  }

  /**
   * Create a new tag
   * Enforces unique name per user
   */
  static async createTag(
    userId: string,
    input: ICreateTagInput
  ): Promise<ITag> {
    const validated = CreateTagInputSchema.parse(input);

    // Check for duplicate name
    const existing = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId,
          name: validated.name,
        },
      },
    });

    if (existing) {
      throw new Error("Tag with this name already exists");
    }

    // Determine order: use provided order, or set to max + 1
    let order: number;
    if (validated.order !== undefined) {
      order = validated.order;
    } else {
      const maxOrderTag = await prisma.tag.findFirst({
        where: { userId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = maxOrderTag ? maxOrderTag.order + 1 : 0;
    }

    const tag = await prisma.tag.create({
      data: {
        userId,
        name: validated.name,
        color: validated.color ?? null,
        description: validated.description ?? null,
        order,
        transactionType: validated.transactionType ?? null,
      },
    });

    return TagSchema.parse({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      order: tag.order,
      transactionType: tag.transactionType ?? null,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    });
  }

  /**
   * Update tag
   */
  static async updateTag(
    userId: string,
    tagId: string,
    input: IUpdateTagInput
  ): Promise<ITag> {
    // Verify tag belongs to user
    const existing = await this.getTagById(userId, tagId);
    if (!existing) {
      throw new Error("Tag not found");
    }

    const validated = UpdateTagInputSchema.parse(input);

    // If updating name, check for duplicates
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await prisma.tag.findUnique({
        where: {
          userId_name: {
            userId,
            name: validated.name,
          },
        },
      });

      if (duplicate) {
        throw new Error("Tag with this name already exists");
      }
    }

    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.color !== undefined && { color: validated.color }),
        ...(validated.description !== undefined && {
          description: validated.description,
        }),
        ...(validated.order !== undefined && { order: validated.order }),
        ...(validated.transactionType !== undefined && {
          transactionType: validated.transactionType,
        }),
      },
    });

    return TagSchema.parse({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      order: tag.order,
      transactionType: tag.transactionType ?? null,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    });
  }

  /**
   * Delete tag
   */
  static async deleteTag(userId: string, tagId: string): Promise<void> {
    // Verify tag belongs to user
    const existing = await this.getTagById(userId, tagId);
    if (!existing) {
      throw new Error("Tag not found");
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });
  }

  /**
   * Bulk create tags
   * Processes each tag individually to allow partial success
   * Returns created tags and errors with indices
   */
  static async bulkCreateTags(
    userId: string,
    input: IBulkCreateTagInput
  ): Promise<IBulkCreateTagResponse> {
    const validated = BulkCreateTagInputSchema.parse(input);

    const created: ITag[] = [];
    const errors: Array<{ index: number; message: string }> = [];

    // Track names seen in this batch to detect duplicates within the batch
    const seenNames = new Set<string>();

    // Get all existing tag names for this user to check against
    const existingTags = await prisma.tag.findMany({
      where: { userId },
      select: { name: true },
    });
    const existingNames = new Set(
      existingTags.map((tag: { name: string }) => tag.name)
    );

    for (let index = 0; index < validated.length; index++) {
      const item = validated[index];

      try {
        // Validate individual item
        const validatedItem = CreateTagInputSchema.parse(item);

        // Check for duplicate within batch
        if (seenNames.has(validatedItem.name)) {
          errors.push({
            index,
            message: "Duplicate tag name within batch",
          });
          continue;
        }

        // Check for duplicate against existing tags
        if (existingNames.has(validatedItem.name)) {
          errors.push({
            index,
            message: "Tag with this name already exists",
          });
          continue;
        }

        // Determine order: use provided order, or set to max + 1
        let order: number;
        if (validatedItem.order !== undefined) {
          order = validatedItem.order;
        } else {
          const maxOrderTag = await prisma.tag.findFirst({
            where: { userId },
            orderBy: { order: "desc" },
            select: { order: true },
          });
          order = maxOrderTag ? maxOrderTag.order + 1 : 0;
        }

        // Create the tag
        const tag = await prisma.tag.create({
          data: {
            userId,
            name: validatedItem.name,
            color: validatedItem.color ?? null,
            description: validatedItem.description ?? null,
            order,
            transactionType: validatedItem.transactionType ?? null,
          },
        });

        const createdTag = TagSchema.parse({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          description: tag.description,
          order: tag.order,
          transactionType: tag.transactionType,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        });

        created.push(createdTag);
        seenNames.add(validatedItem.name);
        existingNames.add(validatedItem.name); // Update to prevent duplicates in same batch
      } catch (error) {
        // Handle validation errors or other errors
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        errors.push({
          index,
          message,
        });
      }
    }

    return {
      created,
      errors,
    };
  }

  /**
   * Reorder tags
   * Updates order values based on the provided array of tag IDs
   * Each tag's order is set to its index in the array
   */
  static async reorderTags(
    userId: string,
    input: IReorderTagsInput
  ): Promise<void> {
    const validated = ReorderTagsInputSchema.parse(input);

    // Verify all tags belong to the user
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: validated.tagIds },
        userId,
      },
      select: { id: true },
    });

    if (tags.length !== validated.tagIds.length) {
      throw new Error("One or more tags not found or do not belong to user");
    }

    // Update each tag's order based on its position in the array
    await prisma.$transaction(
      validated.tagIds.map((tagId, index) =>
        prisma.tag.update({
          where: { id: tagId },
          data: { order: index },
        })
      )
    );
  }
}
