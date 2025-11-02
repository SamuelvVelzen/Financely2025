import {
  CreateTagInputSchema,
  TagSchema,
  TagsQuerySchema,
  UpdateTagInputSchema,
  type CreateTagInput,
  type Tag,
  type TagsQuery,
  type UpdateTagInput,
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
    query: TagsQuery
  ): Promise<{ data: Tag[] }> {
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
  static async getTagById(userId: string, tagId: string): Promise<Tag | null> {
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
  static async createTag(userId: string, input: CreateTagInput): Promise<Tag> {
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
    input: UpdateTagInput
  ): Promise<Tag> {
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
}
