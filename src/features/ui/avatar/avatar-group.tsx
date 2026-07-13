import { Avatar } from "@/features/ui/avatar/avatar";
import {
  avatarSizeClasses,
  type IAvatarSize,
} from "@/features/ui/avatar/avatar-size-classes";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";

export type IAvatarGroupItem = {
  id: string;
  displayName: string;
  imageUrl?: string | null;
};

type IAvatarGroupProps = IPropsWithClassName & {
  items: IAvatarGroupItem[];
  max?: number;
  size?: IAvatarSize;
  showTotalCount?: boolean;
};

export function AvatarGroup({
  items,
  max = 4,
  size = "md",
  showTotalCount = false,
  className,
}: IAvatarGroupProps) {
  const sizeClass = avatarSizeClasses[size];
  const overflowCount = Math.max(0, items.length - max);
  const visibleItems =
    overflowCount > 0 ? items.slice(0, Math.max(1, max - 1)) : items.slice(0, max);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center">
        {visibleItems.map((item, index) => (
          <span
            key={item.id}
            className={cn("relative inline-flex", index > 0 && "-ml-2")}
            style={{ zIndex: index + 1 }}>
            <Avatar
              displayName={item.displayName}
              imageUrl={item.imageUrl}
              size={size}
              className="ring-2 ring-surface"
            />
          </span>
        ))}
        {overflowCount > 0 ? (
          <span
            aria-hidden
            className={cn(
              "relative inline-flex shrink-0 items-center justify-center rounded-full bg-surface-hover font-medium text-text-muted ring-2 ring-surface",
              sizeClass.container,
              sizeClass.text,
              visibleItems.length > 0 && "-ml-2",
            )}
            style={{ zIndex: visibleItems.length + 1 }}>
            +{overflowCount}
          </span>
        ) : null}
      </div>
      {showTotalCount ? (
        <p className="text-xs text-text-muted">
          {items.length} {items.length === 1 ? "person" : "people"}
        </p>
      ) : null}
    </div>
  );
}
