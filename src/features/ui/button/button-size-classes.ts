export type IButtonSize = "xs" | "sm" | "md" | "lg";

/** Shared outer dimensions so text and icon buttons align per size token. */
export const buttonHeightClasses: { [key in IButtonSize]: string } = {
  xs: "h-7",
  sm: "h-8",
  md: "h-9",
  lg: "h-11",
};

export const iconButtonSizeClasses: { [key in IButtonSize]: string } = {
  xs: "h-7! w-7!",
  sm: "h-8! w-8!",
  md: "h-9! w-9!",
  lg: "h-11! w-11!",
};
