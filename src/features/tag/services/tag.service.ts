import {
  BulkCreateTagInputSchema,
  CreateTagInputSchema,
  TagSchema,
  TagsQuerySchema,
  UpdateTagInputSchema,
  type IBulkCreateTagInput,
  type IBulkCreateTagResponse,
  type ICreateTagInput,
  type ITag,
  type ITagsQuery,
  type IUpdateTagInput,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/util/prisma";

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
          name: {
            contains: validated.q,
          },
        }),
      },
      orderBy: {
        name: validated.sort === "name:desc" ? "desc" : "asc",
      },
    });

    return {
      data: tags.map((tag) =>
        TagSchema.parse({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          description: tag.description,
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

    const tag = await prisma.tag.create({
      data: {
        userId,
        name: validated.name,
        color: validated.color ?? null,
        description: validated.description ?? null,
      },
    });

    return TagSchema.parse({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
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
      },
    });

    return TagSchema.parse({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
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
    const existingNames = new Set(existingTags.map((tag) => tag.name));

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

        // Create the tag
        const tag = await prisma.tag.create({
          data: {
            userId,
            name: validatedItem.name,
            color: validatedItem.color ?? null,
            description: validatedItem.description ?? null,
          },
        });

        const createdTag = TagSchema.parse({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          description: tag.description,
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
}
