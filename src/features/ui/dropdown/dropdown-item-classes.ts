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

/** Footer styles when the dropdown uses item rows. */
export const dropdownFooterBorderClasses = cn(
  "bg-surface",
  "group-data-[panel-mode=items]/dropdown-panel:relative group-data-[panel-mode=items]/dropdown-panel:z-0",
  "group-data-[panel-mode=items]/dropdown-panel:-mt-px",
  "group-data-[panel-mode=items]/dropdown-panel:border group-data-[panel-mode=items]/dropdown-panel:border-border",
  "group-data-[panel-mode=items]/dropdown-panel:rounded-b-2xl",
  "group-data-[panel-mode=items]/dropdown-panel:group-data-[expanded=true]/dropdown-panel:rounded-br-none",
  "group-data-[panel-mode=items]/dropdown-panel:group-data-[expanded=true]/dropdown-panel:rounded-bl-2xl"
);

/** Footer styles when the dropdown uses a content panel. */
export const dropdownPanelFooterBorderClasses = cn(
  "bg-surface",
  "group-data-[panel-mode=content]/dropdown-panel:border-t group-data-[panel-mode=content]/dropdown-panel:border-border"
);

/** Outer shell for panel-style dropdown content (border handled by parent). */
export const dropdownPanelContentClasses = "bg-surface";

/** Border and rounding for custom dropdown rows that are not DropdownItem buttons. */
export const dropdownRowBorderClasses = cn("border", dropdownItemBorderClasses);

/** Section label styles for grouped dropdown lists. */
export const dropdownHeaderBorderClasses = dropdownItemBorderClasses;
