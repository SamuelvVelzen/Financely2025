"use client";

import { useFormContext, type UseFormReturn } from "react-hook-form";

/**
 * Helper hook to get form context without throwing if not available.
 * Returns the form context if available, or null if not within a form context.
 * Useful for components that can work both in form mode and controlled mode.
 */
export function useFormContextOptional(): UseFormReturn<
  Record<string, unknown>
> | null {
  try {
    return useFormContext();
  } catch {
    return null;
  }
}

/**
 * Discriminated union type for components that can work in form mode or controlled mode.
 *
 * Form mode: requires `name` prop, cannot have `value` or `onChange`
 * Controlled mode: requires `value` and `onChange`, cannot have `name`
 *
 * All components use value-based onChange for consistency:
 * - Inputs extract value from events internally
 * - Selects pass values directly
 *
 * @template TValue - The type of the value
 */
export type IFormOrControlledMode<TValue> =
  | {
      name: string;
      value?: never;
      onChange?: never;
    }
  | {
      name?: never;
      value: TValue;
      onChange: (value: TValue | undefined) => void;
    };
