import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";

type IDragHandleIconProps = IPropsWithClassName;

/** Six-dot grip icon used for drag-to-reorder affordances. */
export function DragHandleIcon({ className = "size-5" }: IDragHandleIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden>
      <circle cx="7" cy="5" r="1.5" fill="currentColor" />
      <circle cx="7" cy="10" r="1.5" fill="currentColor" />
      <circle cx="7" cy="15" r="1.5" fill="currentColor" />
      <circle cx="13" cy="5" r="1.5" fill="currentColor" />
      <circle cx="13" cy="10" r="1.5" fill="currentColor" />
      <circle cx="13" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

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
