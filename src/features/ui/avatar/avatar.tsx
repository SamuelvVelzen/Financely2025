import { getInitialsFromDisplayName } from "@/features/ui/avatar/get-initials-from-display-name";
import {
  avatarSizeClasses,
  type IAvatarSize,
} from "@/features/ui/avatar/avatar-size-classes";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";

type IAvatarProps = IPropsWithClassName & {
  displayName?: string;
  initials?: string;
  imageUrl?: string | null;
  size?: IAvatarSize;
};

export function Avatar({
  displayName,
  initials,
  imageUrl,
  size = "md",
  className,
}: IAvatarProps) {
  const resolvedInitials =
    initials ??
    (displayName ? getInitialsFromDisplayName(displayName) : "?");
  const sizeClass = avatarSizeClasses[size];

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-primary)_15%,var(--color-surface))] font-semibold text-primary",
        sizeClass.container,
        sizeClass.text,
        className,
      )}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={displayName ?? ""}
          className="size-full object-cover"
        />
      ) : (
        resolvedInitials
      )}
    </span>
  );
}
