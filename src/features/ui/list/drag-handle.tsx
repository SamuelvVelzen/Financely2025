import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { DragHandleIcon } from "./drag-handle-icon";

type IDragHandleProps = IPropsWithClassName;

export function DragHandle({ className = "" }: IDragHandleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center cursor-grab active:cursor-grabbing text-text-muted hover:text-text transition-colors",
        className
      )}
      draggable={false}>
      <DragHandleIcon />
    </div>
  );
}
