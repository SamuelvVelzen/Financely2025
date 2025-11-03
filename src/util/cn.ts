import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes intelligently
 * Handles conflicts and removes duplicates automatically
 *
 * @example
 * cn("px-2 py-1", "px-4") // Returns "py-1 px-4" (px-2 is removed)
 * cn("bg-red-500", "bg-blue-500") // Returns "bg-blue-500"
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return twMerge(...inputs.filter(Boolean));
}
