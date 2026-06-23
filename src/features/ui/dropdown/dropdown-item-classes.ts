import { cn } from "@/features/util/cn";

/** Shared border, rounding, and focus styles for dropdown list children. */
export const dropdownItemBorderClasses = cn(
  "relative z-0 -mt-px first:mt-0 border-border",
  "rounded-none first:rounded-t-2xl last:rounded-b-2xl",
  "group-has-[[data-dropdown-footer]]/dropdown-panel:last:rounded-b-none",
  "group-data-[expanded=true]/dropdown-list:first:rounded-tr-none",
  "group-data-[expanded=true]/dropdown-list:last:rounded-br-none",
  "group-data-[expanded=true]/dropdown-list:last:rounded-bl-2xl",
  "group-has-[[data-dropdown-footer]]/dropdown-panel:group-data-[expanded=true]/dropdown-list:last:rounded-bl-none",
  "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
);

export const dropdownFooterBorderClasses = cn(
  "relative z-0 -mt-px border border-border rounded-none rounded-b-2xl",
  "group-data-[expanded=true]/dropdown-panel:rounded-br-none group-data-[expanded=true]/dropdown-panel:rounded-bl-2xl"
);
