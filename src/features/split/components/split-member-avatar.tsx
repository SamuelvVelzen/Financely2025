import { getMemberInitials } from "@/features/split/utils/get-member-initials";
import { cn } from "@/features/util/cn";

export function SplitMemberAvatar({
  displayName,
  className,
}: {
  displayName: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary",
        className,
      )}>
      {getMemberInitials(displayName)}
    </span>
  );
}
