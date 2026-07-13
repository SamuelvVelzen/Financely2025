export type IAvatarSize = "sm" | "md" | "lg";

export const avatarSizeClasses: {
  [key in IAvatarSize]: { container: string; text: string };
} = {
  sm: { container: "size-7", text: "text-xs" },
  md: { container: "size-10", text: "text-sm" },
  lg: { container: "size-12", text: "text-base" },
};
