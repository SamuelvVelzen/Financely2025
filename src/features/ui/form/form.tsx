"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useState } from "react";
import {
  FieldValues,
  FormProvider,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";

export type IFormProps<T extends FieldValues> = IPropsWithClassName & {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  id?: string;
};

export function Form<T extends FieldValues>({
  id,
  form,
  onSubmit,
  children,
  className,
}: IFormProps<T>) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (data: T) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit");
    }
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn(className)}
        noValidate
        id={id}>
        {children}
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl mt-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              {submitError}
            </p>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
