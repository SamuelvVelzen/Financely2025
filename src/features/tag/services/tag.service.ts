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
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

/**
 * Tag Service
 * Handles tag-related business logic and data access (workspace-scoped).
 */
export class TagService {
  static async listTags(
    userId: string,
    workspaceId: IWorkspaceId,
    query: ITagsQuery
  ): Promise<{ data: ITag[] }> {
    const validated = TagsQuerySchema.parse(query);

    const tags = await prisma.tag.findMany({
      where: {
        userId,
        workspaceId,
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
      data: tags
        .filter((tag) => {
          return (
            tag.transactionType === "EXPENSE" || tag.transactionType === "INCOME"
          );
        })
        .map(
          (tag: {
            id: string;
            name: string;
            color: string | null;
            description: string | null;
            emoticon: string | null;
            order: number;
            transactionType: "EXPENSE" | "INCOME";
            createdAt: Date;
            updatedAt: Date;
          }) =>
            TagSchema.parse({
              id: tag.id,
              name: tag.name,
              color: tag.color,
              description: tag.description,
              emoticon: tag.emoticon,
              order: tag.order,
              transactionType: tag.transactionType,
              createdAt: tag.createdAt.toISOString(),
              updatedAt: tag.updatedAt.toISOString(),
            })
        ),
    };
  }

  static async getTagById(
    userId: string,
    workspaceId: IWorkspaceId,
    tagId: string
  ): Promise<ITag | null> {
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId,
        workspaceId,
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
      emoticon: tag.emoticon,
      order: tag.order,
      transactionType: tag.transactionType,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    });
  }

  static async createTag(
    userId: string,
    workspaceId: IWorkspaceId,
    input: ICreateTagInput
  ): Promise<ITag> {
    const validated = CreateTagInputSchema.parse(input);

    const existing = await prisma.tag.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name: validated.name,
        },
      },
    });

    if (existing) {
      throw new Error("Tag with this name already exists");
    }

    let order: number;
    if (validated.order !== undefined) {
      order = validated.order;
    } else {
      const maxOrderTag = await prisma.tag.findFirst({
        where: { userId, workspaceId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = maxOrderTag ? maxOrderTag.order + 1 : 0;
    }

    const tag = await prisma.tag.create({
      data: {
        userId,
        workspaceId,
        name: validated.name,
        color: validated.color ?? null,
        description: validated.description ?? null,
        emoticon: validated.emoticon ?? null,
        order,
        transactionType: validated.transactionType,
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

  static async updateTag(
    userId: string,
    workspaceId: IWorkspaceId,
    tagId: string,
    input: IUpdateTagInput
  ): Promise<ITag> {
    const existing = await this.getTagById(userId, workspaceId, tagId);
    if (!existing) {
      throw new Error("Tag not found");
    }

    const validated = UpdateTagInputSchema.parse(input);

    if (validated.name && validated.name !== existing.name) {
      const duplicate = await prisma.tag.findUnique({
        where: {
          workspaceId_name: {
            workspaceId,
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
        ...(validated.emoticon !== undefined && {
          emoticon: validated.emoticon,
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
      emoticon: tag.emoticon,
      order: tag.order,
      transactionType: tag.transactionType,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    });
  }

  static async deleteTag(
    userId: string,
    workspaceId: IWorkspaceId,
    tagId: string
  ): Promise<void> {
    const existing = await this.getTagById(userId, workspaceId, tagId);
    if (!existing) {
      throw new Error("Tag not found");
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });
  }

  static async bulkCreateTags(
    userId: string,
    workspaceId: IWorkspaceId,
    input: IBulkCreateTagInput
  ): Promise<IBulkCreateTagResponse> {
    const validated = BulkCreateTagInputSchema.parse(input);

    const created: ITag[] = [];
    const errors: Array<{ index: number; message: string }> = [];

    const seenNames = new Set<string>();

    const existingTags = await prisma.tag.findMany({
      where: { userId, workspaceId },
      select: { name: true },
    });
    const existingNames = new Set(
      existingTags.map((tag: { name: string }) => tag.name)
    );

    for (let index = 0; index < validated.length; index++) {
      const item = validated[index];

      try {
        const validatedItem = CreateTagInputSchema.parse(item);

        if (seenNames.has(validatedItem.name)) {
          errors.push({
            index,
            message: "Duplicate tag name within batch",
          });
          continue;
        }

        if (existingNames.has(validatedItem.name)) {
          errors.push({
            index,
            message: "Tag with this name already exists",
          });
          continue;
        }

        let order: number;
        if (validatedItem.order !== undefined) {
          order = validatedItem.order;
        } else {
          const maxOrderTag = await prisma.tag.findFirst({
            where: { userId, workspaceId },
            orderBy: { order: "desc" },
            select: { order: true },
          });
          order = maxOrderTag ? maxOrderTag.order + 1 : 0;
        }

        const tag = await prisma.tag.create({
          data: {
            userId,
            workspaceId,
            name: validatedItem.name,
            color: validatedItem.color ?? null,
            description: validatedItem.description ?? null,
            order,
            emoticon: validatedItem.emoticon ?? null,
            transactionType: validatedItem.transactionType,
          },
        });

        const createdTag = TagSchema.parse({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          description: tag.description,
          emoticon: tag.emoticon,
          order: tag.order,
          transactionType: tag.transactionType,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        });

        created.push(createdTag);
        seenNames.add(validatedItem.name);
        existingNames.add(validatedItem.name);
      } catch (error) {
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

  static async reorderTags(
    userId: string,
    workspaceId: IWorkspaceId,
    input: IReorderTagsInput
  ): Promise<void> {
    const validated = ReorderTagsInputSchema.parse(input);

    const tags = await prisma.tag.findMany({
      where: {
        id: { in: validated.tagIds },
        userId,
        workspaceId,
      },
      select: { id: true },
    });

    if (tags.length !== validated.tagIds.length) {
      throw new Error("One or more tags not found or do not belong to user");
    }

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
