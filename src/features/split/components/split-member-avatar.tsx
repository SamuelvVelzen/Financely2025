import { Avatar } from "@/features/ui/avatar/avatar";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";

export function SplitMemberAvatar({
  displayName,
  className,
}: {
  displayName: string;
} & IPropsWithClassName) {
  return <Avatar displayName={displayName} size="md" className={className} />;
}
