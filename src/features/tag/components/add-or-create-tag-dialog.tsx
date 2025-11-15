"use client";

import {
  CreateTagInputSchema,
  type Tag,
} from "@/features/shared/validation/schemas";
import { useCreateTag, useUpdateTag } from "@/features/tag/hooks/useTags";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { Form } from "@/features/ui/form/form";
import { ColorInput } from "@/features/ui/input/color-input";
import { TextInput } from "@/features/ui/input/text-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type IAddOrCreateTagDialog = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag;
  onSuccess?: () => void;
};

type FormData = z.infer<typeof CreateTagInputSchema>;

export function AddOrCreateTagDialog({
  open,
  onOpenChange,
  tag,
  onSuccess,
}: IAddOrCreateTagDialog) {
  const [pending, setPending] = useState(false);
  const isEditMode = !!tag;
  const { mutate: createTag } = useCreateTag();
  const { mutate: updateTag } = useUpdateTag();

  const form = useForm<FormData>({
    resolver: zodResolver(CreateTagInputSchema) as any,
    defaultValues: {
      name: "",
      color: "",
      description: "",
    },
  });

  // Reset form when dialog opens/closes or tag changes
  useEffect(() => {
    if (open) {
      if (tag) {
        // Edit mode: populate form with existing tag data
        form.reset({
          name: tag.name,
          color: tag.color ?? "",
          description: tag.description ?? "",
        });
      } else {
        // Create mode: reset to defaults
        form.reset({
          name: "",
          color: "",
          description: "",
        });
      }
    } else {
      // Reset form when dialog closes to ensure clean state
      form.reset({
        name: "",
        color: "",
        description: "",
      });
    }
  }, [open, tag?.id, form]);

  const handleSubmit = async (data: FormData) => {
    setPending(true);

    // Transform empty strings to null for optional fields
    const submitData = {
      name: data.name,
      color:
        data.color &&
        data.color.trim() !== "" &&
        /^#[0-9A-Fa-f]{6}$/.test(data.color.trim())
          ? data.color.trim()
          : null,
      description:
        data.description && data.description.trim() !== ""
          ? data.description.trim()
          : null,
    };

    try {
      if (isEditMode && tag) {
        // Update existing tag
        updateTag(
          { tagId: tag.id, input: submitData },
          {
            onSuccess: () => {
              form.reset({
                name: "",
                color: "",
                description: "",
              });
              setPending(false);
              onOpenChange(false);
              onSuccess?.();
            },
            onError: (error) => {
              setPending(false);
              throw error;
            },
          }
        );
      } else {
        // Create new tag
        createTag(submitData, {
          onSuccess: () => {
            form.reset({
              name: "",
              color: "",
              description: "",
            });
            setPending(false);
            onOpenChange(false);
            onSuccess?.();
          },
          onError: (error) => {
            setPending(false);
            throw error;
          },
        });
      }
    } catch (err) {
      setPending(false);
      throw err; // Let Form component handle the error
    }
  };

  return (
    <Dialog
      title={isEditMode ? "Edit Tag" : "Create Tag"}
      content={
        <Form<FormData>
          form={form}
          onSubmit={handleSubmit}>
          <div className="space-y-4">
            <TextInput
              name="name"
              label="Name"
              disabled={pending}
              required
            />
            <ColorInput
              name="color"
              label="Color"
              disabled={pending}
            />
            <TextInput
              name="description"
              label="Description"
              disabled={pending}
            />
          </div>
        </Form>
      }
      footerButtons={[
        {
          clicked: () => {
            form.reset({
              name: "",
              color: "",
              description: "",
            });
            onOpenChange(false);
          },
          className: `px-4 py-2 border border-border rounded-lg hover:bg-surface-hover motion-safe:transition-colors ${pending ? "opacity-50 cursor-not-allowed" : ""}`,
          buttonContent: "Cancel",
        },
        {
          clicked: () => {
            form.handleSubmit(handleSubmit)();
          },
          className: `px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors ${pending ? "opacity-50 cursor-not-allowed" : ""}`,
          buttonContent: pending
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
              ? "Update"
              : "Create",
        },
      ]}
      open={open}
      onOpenChange={onOpenChange}
      dismissible={!pending}
      variant="modal"
      size="xl"
    />
  );
}
