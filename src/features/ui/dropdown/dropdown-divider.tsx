import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";

type IDropdownDividerProps = {} & IPropsWithClassName;

export function DropdownDivider({ className = "" }: IDropdownDividerProps) {
  return (
    <div
      className={cn(
        "relative z-0 -mt-px border-x border-b border-border border-t-0",
        className
      )}></div>
  );
}
